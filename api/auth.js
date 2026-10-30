// Step 1 of the Decap CMS GitHub login: send the editor to GitHub with a signed, expiring `state`.
import { createState, siteOrigin, requestOrigin, STATE_COOKIE, STATE_MAX_AGE_MS } from './_utils.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // Start on the callback's host so its host-only state cookie survives the round trip.
  if (requestOrigin(req) !== siteOrigin(req)) {
    return res.redirect(302, `${siteOrigin(req)}/api/auth`);
  }
  const clientId = process.env.OAUTH_CLIENT_ID;
  if (!clientId || !process.env.OAUTH_CLIENT_SECRET) {
    res.status(500).send('GitHub login is not configured (OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET).');
    return;
  }

  const { state, nonce } = createState();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${siteOrigin(req)}/api/callback`,
    scope: 'repo,user',
    state,
    allow_signup: 'false',
  });

  // Bind the state to this browser so a stolen callback URL can't be replayed elsewhere.
  res.setHeader(
    'Set-Cookie',
    `${STATE_COOKIE}=${nonce}; Path=/api/callback; Max-Age=${STATE_MAX_AGE_MS / 1000}; HttpOnly; Secure; SameSite=Lax`,
  );
  res.setHeader('Cache-Control', 'no-store');
  res.redirect(302, `https://github.com/login/oauth/authorize?${params}`);
}
