# Infrastructure & Handoff

How mjkalous.com is wired together, and how to hand it to Michael.

## Services at a glance

| Service | Purpose | Owner today | Where the config lives |
|---|---|---|---|
| GitHub | Code + blog posts (`src/content/blog`) | Allen (`alevie76-dev`) | Repo settings |
| GitHub OAuth App | Login for `/admin` | Allen | GitHub → Developer settings → OAuth Apps |
| Vercel | Hosting, builds, `/api` functions | Allen | Vercel project → Settings |
| Name.com | Domain registration (renews April 29, 2027) | Michael | name.com account |
| Cloudflare | DNS for mjkalous.com | Michael | Cloudflare → DNS |
| Resend | Sends contact-form email | TBD | resend.com → Domains / API Keys |
| Kit | Newsletter | Michael (to create) | kit.com |
| Google Analytics 4 | Traffic analytics | TBD | analytics.google.com |
| Meta Pixel | Facebook/Instagram conversion tracking | TBD | Meta Events Manager |
| Google Workspace | `michael@mjkalous.com` inbox | Michael | admin.google.com |

## Launch checklist

- [x] **Inbox exists.** `michael@mjkalous.com` is set up in Michael's Google Workspace.
- [x] **GitHub repo** pushed to `alevie76-dev/mjkalous` (private), matching `repo:` in `public/admin/config.yml`.
- [ ] **Vercel project** imported, with env vars set (see README).
- [ ] **GitHub OAuth App** created, callback `https://mjkalous.com/api/callback`.
- [ ] **Resend**: add and verify the `mjkalous.com` domain (Resend lists the SPF/DKIM DNS records; add them in Cloudflare), create an API key, and set `RESEND_API_KEY` and `CONTACT_FROM_EMAIL` (e.g. `Website Contact Form <contact@mjkalous.com>`).
- [x] **Kit**: form `9992996` ("Join the Wisdom from the Wreckage Community") is wired in as the default `KIT_FORM_ID`. Double opt-in is on.
- [ ] **GA4 / Pixel**: set `GA_MEASUREMENT_ID` and `META_PIXEL_ID`, then redeploy.
- [ ] **DNS cutover** (below), only after Michael approves the new design. Until then, review on the `*.vercel.app` URL.
- [ ] **After launch**: submit `https://mjkalous.com/sitemap-index.xml` in Google Search Console. Test the contact form, newsletter signup, and `/admin` login on the live domain. Confirm the old Tertulia post URLs redirect.

## DNS (Cloudflare → Vercel)

The domain stays on Cloudflare nameservers. Only the web records change:

1. In Vercel → Project → **Settings → Domains**, add `mjkalous.com` and `www.mjkalous.com`. Vercel then shows the exact records to create.
2. In Cloudflare → DNS, replace the current Tertulia records with the ones Vercel shows. Typically:
   - `A` `@` → Vercel's IP (e.g. `76.76.21.21`)
   - `CNAME` `www` → `cname.vercel-dns.com` (or the project-specific value Vercel gives)
3. Set these records to **DNS only** (grey cloud). Vercel issues its own SSL certificate, and Cloudflare's proxy interferes with that.
4. **Leave MX, SPF, DKIM, and other email records alone.** Only the `@` and `www` web records change.
5. Pick one canonical host (apex `mjkalous.com` is recommended) and have Vercel redirect the other to it.

Rollback: restore the previous Tertulia `A`/`CNAME` values in Cloudflare.

Old Tertulia blog URLs (`/blog/<slug>/<id>`) and `/books` are 301-redirected in `vercel.json`.

## Security notes

- Secrets live only in Vercel environment variables. `.env*` files are git-ignored, and `.env.example` documents the variable names.
- The OAuth `state` is signed with HMAC-SHA256, expires after 10 minutes, and is bound to the browser with an HttpOnly cookie. The token is posted only to the site's own origin.
- The contact form validates input and caps its length, escapes HTML, strips newlines from the subject, and has a honeypot field. There is no rate limiting. If spam becomes a problem, add Vercel's firewall rate limiting or Cloudflare Turnstile.
- The `repo` OAuth scope gives the editor's token write access to every repo the logged-in user can reach. That is Decap's standard GitHub setup. Only give editor access to people you trust.

## Handoff: transferring to Michael

Do these in order, so the site stays up throughout.

1. **GitHub repo**: Repo → Settings → *Transfer ownership* to Michael's GitHub account. Then update `repo:` in `public/admin/config.yml` to `<michael>/<repo>` and commit.
2. **Vercel project**: Project → Settings → *Transfer project* to Michael's Vercel account or team. Reconnect the Git integration to the transferred repo if Vercel asks.
3. **Domain**: Once the project has moved, confirm `mjkalous.com` shows as valid in Michael's Vercel project. The Cloudflare records stay the same, because Vercel's values don't change on transfer. If Vercel asks for a TXT verification record, add it in Cloudflare.
4. **GitHub OAuth App**: Create a new OAuth App under Michael's account (same settings as in the README), or transfer the existing one (OAuth App → *Transfer ownership*).
5. **Env vars**: In Vercel, update `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` if the app changed, then redeploy.
6. **Contact form**: Make sure the Resend account and API key belong to Michael (or create his own, verify the domain, and swap `RESEND_API_KEY`). Confirm that mail reaches `michael@mjkalous.com`.
7. **Analytics**: GA4: Admin → Account access management → add Michael as Administrator, then remove yourself. Meta: in Business Settings, give Michael's Business account ownership of the Pixel/dataset.
8. **Kit**: Should already be Michael's account. If you created it, transfer ownership in Kit's account settings.
9. **Remove your access** from the repo, Vercel, Cloudflare, and Resend once Michael confirms everything works.
