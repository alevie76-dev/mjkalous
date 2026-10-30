// Shared helpers for the Vercel serverless functions. Files starting with "_" are not deployed as routes.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const STATE_MAX_AGE_MS = 10 * 60 * 1000;
export const STATE_COOKIE = 'decap_oauth_state';

function secret() {
  // A dedicated secret is preferred; fall back to the OAuth client secret so setup needs one less variable.
  const s = process.env.OAUTH_STATE_SECRET || process.env.OAUTH_CLIENT_SECRET;
  if (!s) throw new Error('OAUTH_CLIENT_SECRET is not set');
  return s;
}

export function sign(value) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

/** Constant-time string comparison (length is not secret). */
export function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** `nonce.timestamp.signature` */
export function createState() {
  const nonce = randomBytes(16).toString('base64url');
  const payload = `${nonce}.${Date.now()}`;
  return { state: `${payload}.${sign(payload)}`, nonce };
}

/** Returns the nonce if the state is authentic and fresh, otherwise null. */
export function verifyState(state) {
  if (typeof state !== 'string') return null;
  const parts = state.split('.');
  if (parts.length !== 3) return null;
  const [nonce, ts, sig] = parts;
  if (!safeEqual(sig, sign(`${nonce}.${ts}`))) return null;
  const age = Date.now() - Number(ts);
  if (!Number.isFinite(age) || age < 0 || age > STATE_MAX_AGE_MS) return null;
  return nonce;
}

export function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

/** Public origin of this deployment, e.g. https://mjkalous.com */
export function siteOrigin(req) {
  return new URL(process.env.SITE_URL || 'https://mjkalous.com').origin;
}

export function requestOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${req.headers['x-forwarded-host'] || req.headers.host}`;
}
