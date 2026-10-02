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
| Kit | Newsletter | Michael (account under his credentials) | kit.com |
| Google Analytics 4 | Traffic analytics | TBD | analytics.google.com |
| Meta Pixel | Facebook/Instagram conversion tracking | TBD | Meta Events Manager |
| Google Workspace | `michael@mjkalous.com` inbox, plus the `contact@mjkalous.com` alias | Michael | admin.google.com |

## Email addresses

| Address | What it is | Where mail goes |
|---|---|---|
| `michael@mjkalous.com` | Michael's Google Workspace mailbox | His Gmail inbox |
| `contact@mjkalous.com` | Workspace **alias** of Michael's account (not a separate mailbox, no extra license) | The same Gmail inbox as `michael@` |

**How a contact-form message travels:**

1. A visitor submits the form on the site.
2. `/api/contact` asks Resend to send an email:
   - **From:** `Website Contact Form <contact@mjkalous.com>`
   - **To:** `michael@mjkalous.com` (`CONTACT_TO_EMAIL`)
   - **Reply-To:** the visitor's own email address
3. It arrives in Michael's Gmail inbox. When he clicks **Reply**, the reply goes straight to the visitor, sent from `michael@` (or from `contact@` if he picks it in the From menu).

Why the alias matters even though the form delivers to `michael@`:
- **Replies and bounces to `contact@` aren't lost.** If anyone writes to `contact@mjkalous.com` directly, or replies to the From address instead of Reply-To, it lands in Michael's inbox.
- **It gives Michael a public address.** `contact@` can be published (e.g. on the site, in a book signature, or on social profiles) while `michael@` stays more private.

Notes:
- **Sending from `contact@`:** Michael can choose `contact@` as the From address in Gmail. Set it up once in Gmail → Settings → Accounts → **Send mail as** → Add another email address. Workspace aliases verify automatically, so no password or server settings are needed. Side effect: once `contact@` is one of his "send as" addresses, Gmail may show incoming form messages as from **"me"** in the inbox list. The subject ("New message from *Name* via mjkalous.com") still identifies them.
- **The alias receives mail through Workspace's MX records.** Resend is only used to *send* the form emails, and the site cutover doesn't touch MX, so the alias works the same before and after launch.
- **Filtering form messages:** a Gmail filter on `from:contact@mjkalous.com subject:"via mjkalous.com"` can label them (e.g. "Website") so they're easy to find.

## Launch checklist

- [x] **Inbox exists.** `michael@mjkalous.com` is set up in Michael's Google Workspace.
- [x] **`contact@` alias** created on Michael's Workspace account (2026-10-02). See [Email addresses](#email-addresses).
- [x] **GitHub repo** pushed to `alevie76-dev/mjkalous` (private), matching `repo:` in `public/admin/config.yml`.
- [x] **Vercel project** imported as `opsrelay-projects/mjkalous` and linked locally (`vercel link`). Preview at mjkalous.vercel.app.
- [ ] **GitHub OAuth App** created, callback `https://mjkalous.com/api/callback`.
- [x] **Resend integration** installed through Vercel (region `us-east-1`). It set `RESEND_API_KEY` and `RESEND_EMAIL_DOMAIN`, and the contact form sends as `contact@mjkalous.com`.
- [ ] **Resend DNS records** added in Cloudflare and the domain shows **Verified** in Resend. Until then, the contact form returns an error and tells visitors to email Michael directly.
- [x] **Kit account** created under Michael's credentials. Form `9992996` ("Join the Wisdom from the Wreckage Community") is wired in as the default `KIT_FORM_ID`. Double opt-in is on.
- [ ] **Kit welcome email sequence**: set up the automation that follows a new signup. Scheduled for after the DNS cutover.
- [ ] **GA4 / Pixel**: set `GA_MEASUREMENT_ID` and `META_PIXEL_ID`, then redeploy.
- [ ] **DNS cutover** (below), only after Michael approves the new design. Until then, review on the `*.vercel.app` URL.
- [ ] **After launch**: submit `https://mjkalous.com/sitemap-index.xml` in Google Search Console. Test the contact form, newsletter signup, and `/admin` login on the live domain. Confirm the old Tertulia post URLs redirect.

## Cloudflare session with Michael

Michael logs in to Cloudflare (dash.cloudflare.com, **mjkalous.com → DNS**). Do both parts in the same sitting.

**Part 1: email records for Resend (safe to do any time).**
1. In Vercel → mjkalous project → Integrations → Resend (or resend.com → Domains → mjkalous.com), copy the DNS records it lists. Usually these are an MX and a TXT (SPF) record on a `send` subdomain, plus a TXT (DKIM) record such as `resend._domainkey`.
2. Add each one in Cloudflare exactly as shown, with the proxy **off** (grey cloud).
3. **Don't edit or delete the existing MX records on `@`.** Those deliver Michael's Google Workspace email. Resend's records live on their own subdomains and don't touch them.
4. Back in Resend, click **Verify**. It can take a few minutes, occasionally longer.
5. Send a test message from the contact page and confirm it arrives at michael@mjkalous.com.

**Part 2: point the website at Vercel (only once Michael approves the design).** Follow the next section.

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
8. **Kit**: Already Michael's account, created with his credentials. Remove your access (Settings → Team) if you were added.
9. **Remove your access** from the repo, Vercel, Cloudflare, and Resend once Michael confirms everything works.
