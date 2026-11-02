# Security audit — November 2, 2026

Scope: source at commit d64a19e, installed/locked dependencies, and passive HTTP header checks of https://mjkalous.com and /admin. Local abuse tests mocked the email service; no email was sent. No production exploitation, account-setting changes, or application fixes were performed. This review cannot establish whether a compromise has occurred.

## Prioritized findings

### 1. High potential impact: broad GitHub OAuth grants

Evidence: `api/auth.js:20` requests `repo,user`. A stolen editor token could affect repositories accessible to the signed-in user beyond this site; the scope is not restricted to the configured repository. This is an excessive-permission risk, not a demonstrated token leak. See [GitHub OAuth scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps).

Recommendation: remove `user` unless a verified CMS feature needs it. If the repository is public, test `public_repo`; this still covers other public repositories. For stronger isolation, use a dedicated editor account with access only to this repository, or evaluate a compatible GitHub App integration with repository-scoped permissions. Revoke existing grants and reauthorize after reducing scopes; changing the request alone does not reliably shrink previously granted permissions. Require passkeys/2FA for editors and infrastructure owners.

### 2. Medium: public email endpoint lacks application rate limits

Evidence: `api/contact.js:23–96` accepts anonymous submissions, with a honeypot as its only bot-specific control. Ten local requests with an empty honeypot and an unrelated Origin each reached the mocked sender and returned 200. Edge firewall configuration was not inspected and could mitigate this externally. The recipient is fixed, so this is not an arbitrary-recipient mail relay.

Impact: inbox flooding, quota exhaustion, and service costs. Recommendation: add durable per-client and global rate limits, server-verified bot challenges, and usage alerts. Start with a small burst allowance and tune from legitimate traffic. Reject unexpected content types and oversized bodies before processing; validate strings instead of coercing arbitrary objects. Check Origin as defense in depth, not as bot authentication. Use a domain-restricted sending-only Resend key. Add bounded upstream timeouts and retry-safe submission IDs. [Vercel rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [Resend key permissions](https://github.com/resend/resend-skills/blob/main/skills/resend/references/api-keys.md).

### 3. Medium, requires publishing access: unsafe JSON-LD serialization

Evidence: `src/layouts/BaseLayout.astro:83–84` inserts `JSON.stringify(...)` using `set:html`. Blog title/excerpt/tags feed this data. A literal `</script>` survives JSON serialization and can terminate the HTML script element even when its type is application/ld+json. Confirmed the unsafe serialization locally; did not publish a malicious post or execute it in a browser.

Impact: malicious or compromised content publication could execute scripts for readers, with additional risk to an editor visiting the same origin. Content authors already control Markdown and may have repository write access, so this is not an anonymous privilege escalation.

Recommendation: use a shared HTML-safe JSON serializer that replaces literal `<` with the JSON escape `\u003c` before insertion. Review raw Markdown HTML and URL sanitization, especially before adding less-trusted contributors. Add a regression test that renders adversarial metadata. [OWASP guidance on JSON in script contexts](https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.md).

### 4. Medium hardening gap: external CMS script and missing CSP

Evidence: `public/admin/index.html:24` loads a version-pinned Decap bundle from unpkg without an integrity hash. Live HEAD responses for both / and /admin have no Content-Security-Policy. A CDN-delivered malicious script would run with editor-page privileges. No CDN compromise was observed.

Recommendation: bundle/self-host a reviewed CMS release, or add SRI and crossorigin to the exact pinned artifact. Scan that bundle separately: npm audit does not cover the externally loaded Decap bundle. Introduce CSP in report-only mode, inventory required analytics/video/newsletter connections, then enforce it. Use a stricter policy for admin and callback routes; hash or nonce inline scripts instead of broadly permitting unsafe-inline. Include restrictive object-src, base-uri, and frame-ancestors directives. Test CMS previews, OAuth popups, forms, and analytics before enforcement.

### 5. Medium operational priority: known dependency advisories

The live npm audit returned 5 affected package entries: 3 high, 2 moderate, 0 critical. Counts include the parent typography package and its vulnerable parser; these are not five independent exploit paths.

| Installed package | Registry severity | Context / recommendation |
| --- | --- | --- |
| undici 8.11.2 | High | Via Astro → unifont. Audit identifies fixes in 8.12.2 for the reported issues. Update through a compatible dependency resolution. |
| vite 8.3.1 | High | Development/build tooling; reported vulnerable range ends at 8.3.2. Upgrade to a supported patched release. Keep dev servers off public interfaces. |
| zod 4.6.5 | High | Build/content validation here; reported memory-exhaustion issue affects versions below 4.6.6. Upgrade compatibly. |
| postcss-selector-parser 6.0.10 | Moderate | Via typography, during CSS processing; reported affected range below 6.1.5. Update parent or apply a tested compatible override. |
| @tailwindcss/typography 0.5.20 | Moderate | Parent affected through the parser above. Do not blindly apply npm's suggested downgrade to 0.5.4. |

Production output is static HTML plus standalone API functions. These package findings primarily concern build/developer exposure; no production exploit path was established. The API functions use Node's built-in fetch, whose bundled implementation is governed by the deployed Node runtime, not merely the npm undici version. Verify the Vercel Node runtime and keep it supported/patched.

Advisory examples: [Undici](https://github.com/advisories/GHSA-xjj6-f33q-929c), [Vite](https://github.com/advisories/GHSA-587h-7wmj-h5pm), [Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), [PostCSS parser](https://github.com/advisories/GHSA-rj75-hqrm-r3gf). Re-run npm audit after updating and validate a clean install, build, preview, and editor login. Configure ongoing dependency alerts and reviewed update PRs.

### 6. Low: malformed OAuth cookies cause unhandled exceptions

Evidence: `api/_utils.js:48` calls decodeURIComponent without handling malformed encoding; `api/callback.js:38` invokes it outside the try block. A local callback with `decap_oauth_state=%` throws URIError.

Recommendation: catch decode errors and reject invalid login attempts cleanly. Also restrict auth/callback to GET, bound GitHub fetch timeouts, and verify both event.origin and event.source === window.opener in the popup handshake. The exception demonstrated is request-scoped; it does not establish authentication bypass or site-wide denial of service.

## Existing protections observed

- Static public pages reduce server-side attack surface; no database or general-purpose file-upload API was found.
- OAuth state uses random nonces, HMAC signatures, constant-time comparison, a ten-minute lifetime, and browser cookie binding. Cookies are HttpOnly, Secure, and SameSite=Lax. Callback origin is configured rather than taken from a query parameter; token responses use no-store.
- Contact fields have length limits, email HTML is escaped, subjects strip CR/LF, and destination addresses are server controlled.
- Live headers include HSTS, nosniff, SAMEORIGIN frame protection, Referrer-Policy, and Permissions-Policy.
- .env.local is ignored; only .env.example is tracked. A targeted pattern check of application source/public assets/docs found no matching private-key or common token patterns. This was not a full Git-history or secret scan.

## Account and deployment checks still required

Dashboard settings were not audited: GitHub/Vercel/registrar MFA and memberships, branch protection, secret scanning, OAuth grants, production versus preview secret isolation, firewall rules, Resend key scope, log retention, backups, DNS/DMARC, and incident logs. Verify these before treating this as a complete infrastructure assessment. Protect preview deployments, restrict production secrets to trusted environments, and test recovery from repository and account compromise. noindex on /admin is not access control; GitHub repository authorization remains essential.

## Suggested order

1. Reduce editor-account permissions and enable/verify strong MFA; add contact abuse controls and spending alerts.
2. Patch compatible dependencies, fix JSON-LD serialization, and handle malformed cookies.
3. Self-host or integrity-pin Decap; stage and enforce CSP after functional testing.
4. Complete dashboard checks and establish recurring dependency/security monitoring.
