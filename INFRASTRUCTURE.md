# Infrastructure & Handoff

How mjkalous.com is wired together, and how to hand it to Michael.

## Services at a glance

| Service | Purpose | Owner today | Where the config lives |
|---|---|---|---|
| GitHub | Code + blog posts (`src/content/blog`) | Allen (`alevie76-dev`) | Repo settings |
| GitHub OAuth App | Login for `/admin` | Allen | GitHub → Developer settings → OAuth Apps |
| Vercel | Hosting, builds, `/api` functions | Allen | Vercel project → Settings |
| Namecheap | Domain registration (paid through April 29, 2028; WithheldForPrivacy through October 12, 2027) | Allen (paid on Allen's card); moves to Michael after the 60-day lock | namecheap.com → Domain List |
| Vercel DNS | DNS for mjkalous.com (nameservers `ns1/ns2.vercel-dns.com`) | Allen (lives with the Vercel account) | Vercel → Domains → mjkalous.com |
| Resend | Sends contact-form email | TBD | resend.com → Domains / API Keys |
| Kit | Newsletter | Michael (account under his credentials) | kit.com |
| Google Analytics 4 | Traffic analytics | TBD | analytics.google.com |
| Meta Pixel | Facebook/Instagram conversion tracking | TBD | Meta Events Manager |
| Google Search Console | Search indexing and performance | Michael | search.google.com/search-console |
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
- **The alias receives mail through Workspace's MX records** (now in Vercel DNS). Resend is only used to *send* the form emails and never touches MX.
- **Filtering form messages:** a Gmail filter on `from:contact@mjkalous.com subject:"via mjkalous.com"` can label them (e.g. "Website") so they're easy to find.

## Launch checklist

- [x] **Inbox exists.** `michael@mjkalous.com` is set up in Michael's Google Workspace.
- [x] **`contact@` alias** created on Michael's Workspace account (2026-10-02). See [Email addresses](#email-addresses).
- [x] **GitHub repo** pushed to `alevie76-dev/mjkalous` (private), matching `repo:` in `public/admin/config.yml`.
- [x] **Vercel project** imported as `opsrelay-projects/mjkalous` and linked locally (`vercel link`). Preview at mjkalous.vercel.app.
- [ ] **GitHub OAuth App** created, callback `https://mjkalous.com/api/callback`.
- [x] **Resend integration** installed through Vercel (region `us-east-1`). It set `RESEND_API_KEY` and `RESEND_EMAIL_DOMAIN`, and the contact form sends as `contact@mjkalous.com`.
- [x] **Resend DNS records** added in Vercel DNS and the domain **Verified** in Resend (2026-10-12).
- [x] **Kit account** created under Michael's credentials. Form `9992996` ("Join the Wisdom from the Wreckage Community") is wired in as the default `KIT_FORM_ID`. Double opt-in is on.
- [ ] **Kit welcome email sequence**: set up the automation that follows a new signup. Scheduled for after the DNS cutover.
- [x] **GA4**: Measurement ID `G-K7QTM4RHVL` set as `GA_MEASUREMENT_ID` (Production only, so branch previews and local dev aren't tracked) and production redeployed (2026-10-02). Still to do in GA4 admin: data retention → 14 months; mark `sign_up` and `generate_lead` as key events once they've fired.
- [ ] **Meta Pixel**: create in Events Manager under Michael's business portfolio, set `META_PIXEL_ID` (Production), redeploy. Domain verification TXT record goes in Vercel DNS.
- [x] **Domain moved** from Name.com to Namecheap (Allen's account), nameservers pointed at Vercel DNS, and Google Workspace email records (MX, SPF, DKIM) recreated in Vercel. The site is live on Vercel; Tertulia and Cloudflare are no longer used.
- [ ] **Move the domain to Michael's Namecheap account** after the 60-day lock. See [Handoff](#handoff-transferring-to-michael).
- [ ] **After launch**: submit `https://mjkalous.com/sitemap-index.xml` in Google Search Console. Test the contact form, newsletter signup, and `/admin` login on the live domain. Confirm the old Tertulia post URLs redirect.

## DNS (Vercel)

The domain is registered at Namecheap with its nameservers set to **`ns1.vercel-dns.com` / `ns2.vercel-dns.com`**, so every record is managed in Vercel → **Domains → mjkalous.com**. Namecheap's own Advanced DNS tab is ignored while those nameservers are set.

Records in place (checked 2026-10-12):

| Type | Name | Value | Purpose |
|---|---|---|---|
| A / ALIAS | `@`, `www` | Vercel (managed automatically) | Website. `www` redirects to `mjkalous.com` |
| MX | `@` | `aspmx.l.google.com` (10) + `alt1`–`alt4` (20–50) | Google Workspace mail delivery |
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` | SPF for Google Workspace |
| TXT | `google._domainkey` | Google DKIM key | DKIM for Google Workspace |
| TXT | `resend._domainkey` | Resend DKIM key | DKIM for contact-form email (Resend) |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` (10) | Resend bounce handling |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF for Resend |

**Don't edit or delete the Google MX, SPF, or DKIM records.** They deliver Michael's email. **Don't remove the Resend records either.** Without them the contact form fails with "Your message could not be sent."

If the Resend records ever need re-adding (e.g. a new Resend account), copy them from resend.com → Domains → mjkalous.com, add them in Vercel → Domains, then click **Verify** in Resend.

Optional: add a DMARC record (`_dmarc` TXT, e.g. `v=DMARC1; p=none; rua=mailto:michael@mjkalous.com`). There isn't one yet.

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
3. **Domain and DNS**: DNS is hosted in Vercel, so the records travel with the domain in Vercel. After the project moves, confirm `mjkalous.com` and every DNS record (especially the Google MX/SPF/DKIM and Resend records) appear under Michael's Vercel account. If the domain stays in Allen's Vercel account, move it under Vercel → Domains → mjkalous.com → *Move*.
4. **Registrar (Namecheap)**: After the 60-day lock from the Name.com → Namecheap transfer (roughly mid-December 2026), create a Namecheap account for Michael and use **Domain List → Sharing & Transfer → Push domain** to move `mjkalous.com` into it. Keep the nameservers set to `ns1/ns2.vercel-dns.com`. Have Michael put his own card on auto-renew (current term runs through April 29, 2028; WithheldForPrivacy through October 12, 2027). Settle up for the registration Allen paid for.
5. **GitHub OAuth App**: Create a new OAuth App under Michael's account (same settings as in the README), or transfer the existing one (OAuth App → *Transfer ownership*).
6. **Env vars**: In Vercel, update `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` if the app changed, then redeploy.
7. **Contact form**: Make sure the Resend account and API key belong to Michael (or create his own, verify the domain, and swap `RESEND_API_KEY`). Confirm that mail reaches `michael@mjkalous.com`.
8. **Analytics**: GA4: Admin → Account access management → add Michael as Administrator, then remove yourself. Meta: in Business Settings, give Michael's Business account ownership of the Pixel/dataset.
9. **Kit**: Already Michael's account, created with his credentials. Remove your access (Settings → Team) if you were added.
10. **Remove your access** from the repo, Vercel, Namecheap, and Resend once Michael confirms everything works.
