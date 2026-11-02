// Step 2 of the Decap CMS GitHub login: verify `state`, exchange `code` for a token,
// and hand the token to the /admin window via the postMessage handshake Decap expects.
import { verifyState, readCookie, safeEqual, siteOrigin, STATE_COOKIE } from './_utils.js';
import { safeJson } from '../src/lib/safe-json.mjs';
import { createHash } from 'node:crypto';

function page(origin, status, content) {
  // JSON.stringify output is embedded in a <script>; escape "<" so it can't close the tag.
  const message = safeJson(`authorization:github:${status}:${JSON.stringify(content)}`);
  const target = JSON.stringify(origin);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Signing in…</title></head><body>
<p>${status === 'success' ? 'Signed in. You can close this window.' : 'Sign-in failed. Please close this window and try again.'}</p>
<script>
(function () {
  var target = ${target};
  if (!window.opener) return;
  window.addEventListener('message', function (e) {
    if (e.origin !== target || e.source !== window.opener) return;
    window.opener.postMessage(${message}, target);
  });
  window.opener.postMessage('authorizing:github', target);
})();
</script></body></html>`;
}

export default async function handler(req, res) {
  const origin = siteOrigin(req);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method not allowed');
  }
  // Clear the one-time state cookie whatever happens.
  res.setHeader('Set-Cookie', `${STATE_COOKIE}=; Path=/api/callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);

  const send = (status, result, content) => {
    const html = page(origin, result, content);
    const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    const hash = createHash('sha256').update(script).digest('base64');
    res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'sha256-${hash}'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`);
    res.setHeader('Referrer-Policy', 'no-referrer');
    return res.status(status).send(html);
  };
  const fail = (status, error) => send(status, 'error', { error });

  const { code, state, error } = req.query;
  if (error) return fail(400, String(error));
  if (typeof code !== 'string' || !code) return fail(400, 'Missing code');

  const nonce = verifyState(state);
  const cookieNonce = readCookie(req, STATE_COOKIE);
  if (!nonce || !cookieNonce || !safeEqual(nonce, cookieNonce)) {
    return fail(403, 'Invalid or expired login attempt');
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: `${origin}/api/callback`,
      }),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok || !data.access_token) {
      return fail(401, data.error_description || data.error || 'Token exchange failed');
    }
    return send(200, 'success', { token: data.access_token, provider: 'github' });
  } catch {
    return fail(502, 'Could not reach GitHub');
  }
}
