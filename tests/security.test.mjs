import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { safeJson } from '../src/lib/safe-json.mjs';
import { createState, readCookie } from '../api/_utils.js';
import callback from '../api/callback.js';
import auth from '../api/auth.js';
import { handleContact } from '../api/contact.js';

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
  Object.assign(process.env, originalEnv);
});

function response() {
  return {
    headers: {}, code: 200,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; },
    redirect(code, url) { this.code = code; this.url = url; },
  };
}
function contactRequest(overrides = {}) {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://mjkalous.com' },
    body: { name: 'Test <visitor>', email: 'delivered@resend.dev', message: '<script>untrusted</script>' },
    ...overrides,
  };
}

test('metadata round-trips without an HTML script terminator', () => {
  const value = { title: '</ScRiPt><script>alert(1)</script>', excerpt: '<!-- < & "' };
  const json = safeJson(value);
  assert.ok(!json.includes('<'));
  assert.deepEqual(JSON.parse(json), value);
});

test('malformed state cookies reject the callback without a server exception', async () => {
  process.env.OAUTH_CLIENT_SECRET = 'test-only';
  assert.equal(readCookie({ headers: { cookie: 'decap_oauth_state=%' } }, 'decap_oauth_state'), null);
  const res = response();
  await callback({ method: 'GET', headers: { cookie: 'decap_oauth_state=%' }, query: { code: 'unused', state: 'invalid' } }, res);
  assert.equal(res.code, 403);
  assert.match(res.headers['Content-Security-Policy'], /script-src 'sha256-/);
});

test('OAuth endpoints reject non-GET methods', async () => {
  for (const handler of [auth, callback]) {
    const res = response();
    await handler({ method: 'POST', headers: {}, query: {} }, res);
    assert.equal(res.code, 405);
    assert.equal(res.headers.Allow, 'GET');
  }
});

test('callback requires its opener and correct origin; CSP matches the actual script', async () => {
  process.env.OAUTH_CLIENT_SECRET = 'test-only';
  const { state, nonce } = createState();
  globalThis.fetch = async (_url, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, json: async () => ({ access_token: 'test<token' }) };
  };
  const res = response();
  await callback({ method: 'GET', headers: { cookie: `decap_oauth_state=${nonce}` }, query: { code: 'test', state } }, res);
  assert.equal(res.code, 200);
  const script = res.body.match(/<script>([\s\S]*?)<\/script>/)[1];
  const hash = createHash('sha256').update(script).digest('base64');
  assert.ok(res.headers['Content-Security-Policy'].includes(`'sha256-${hash}'`));
  const messages = [];
  let listener;
  const opener = { postMessage: (...args) => messages.push(args) };
  vm.runInNewContext(script, { window: { opener, addEventListener: (_type, fn) => { listener = fn; } } });
  assert.equal(messages.length, 1);
  listener({ origin: 'https://evil.invalid', source: opener });
  listener({ origin: 'https://mjkalous.com', source: {} });
  assert.equal(messages.length, 1);
  listener({ origin: 'https://mjkalous.com', source: opener });
  assert.ok(messages[1][0].includes('test<token'));
});

test('invalid contact submissions never reach bot verification or email', async () => {
  const cases = [
    [contactRequest({ method: 'GET' }), 405],
    [contactRequest({ headers: { 'content-type': 'text/plain' } }), 415],
    [contactRequest({ headers: { 'content-type': 'application/json', origin: 'https://evil.invalid' } }), 403],
    [contactRequest({ body: [] }), 400],
    [contactRequest({ body: { name: {}, email: 'delivered@resend.dev', message: 'test' } }), 400],
    [contactRequest({ body: { name: 'test', email: 'delivered@resend.dev', message: 'x'.repeat(5001) } }), 400],
    [contactRequest({ body: { ignored: 'x'.repeat(24001) } }), 413],
  ];
  for (const [req, expected] of cases) {
    const res = response();
    await handleContact(req, res, async () => assert.fail('must not verify invalid input'));
    assert.equal(res.code, expected);
  }
});

test('bots and failed verification cannot send email', async () => {
  globalThis.fetch = async () => assert.fail('must not send email');
  for (const [verify, expected] of [
    [async () => ({ isBot: true }), 403],
    [async () => ({}), 403],
    [async () => { throw new Error('unavailable'); }, 503],
  ]) {
    const res = response();
    await handleContact(contactRequest(), res, verify);
    assert.equal(res.code, expected);
  }
});

test('only configured preview origins are accepted, and deployed checks never use the development bypass', async () => {
  process.env.VERCEL = '1';
  process.env.VERCEL_ENV = 'preview';
  process.env.NODE_ENV = 'development';
  process.env.VERCEL_URL = 'mjkalous-test.vercel.app';
  process.env.RESEND_API_KEY = 'test-only';
  globalThis.fetch = async () => ({ ok: true });
  const req = contactRequest({ headers: { 'content-type': 'application/json', origin: 'https://mjkalous-test.vercel.app' } });
  const res = response();
  await handleContact(req, res, async (options) => {
    assert.equal(options.developmentOptions.isDevelopment, false);
    return { isBot: false };
  });
  assert.equal(res.code, 200);
  process.env.VERCEL_ENV = 'production';
  const rejected = response();
  await handleContact(req, rejected, async () => assert.fail('Production must reject preview origins'));
  assert.equal(rejected.code, 403);
  // `vercel dev` sets VERCEL=1 too; it must retain the documented local bypass.
  process.env.VERCEL_ENV = 'development';
  const local = response();
  await handleContact(contactRequest({ headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' } }), local, async (options) => {
    assert.equal(options.developmentOptions.isDevelopment, true);
    return { isBot: false };
  });
  assert.equal(local.code, 200);
});

test('verified contact and speaking submissions escape HTML and deduplicate retries', async () => {
  process.env.RESEND_API_KEY = 'test-only';
  const sends = [];
  globalThis.fetch = async (url, options) => { sends.push({ url, ...options }); return { ok: true }; };
  const verify = async (options) => {
    assert.equal(options.advancedOptions.checkLevel, 'basic');
    return { isBot: false };
  };
  for (let i = 0; i < 2; i++) {
    const res = response();
    await handleContact(contactRequest(), res, verify);
    assert.equal(res.code, 200);
  }
  assert.equal(sends[0].headers['Idempotency-Key'], sends[1].headers['Idempotency-Key']);
  assert.ok(sends[0].signal instanceof AbortSignal);
  const email = JSON.parse(sends[0].body);
  assert.ok(!email.html.includes('<script>'));
  assert.ok(email.html.includes('&lt;script&gt;'));
  const res = response();
  await handleContact(contactRequest({ body: { ...contactRequest().body, form: 'speaking', organization: 'Test org' } }), res, verify);
  assert.equal(res.code, 200);
  assert.notEqual(sends[0].headers['Idempotency-Key'], sends[2].headers['Idempotency-Key']);
});
