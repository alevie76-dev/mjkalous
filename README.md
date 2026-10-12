# mjkalous.com

Website for Michael J. Kalous, author of *Wisdom From the Wreckage*. Built with Astro (static), React islands for the forms, Tailwind CSS v4, a Decap CMS blog editor backed by GitHub, and Vercel serverless functions.

| Path | What it is |
|------|-----------|
| `src/pages/` | Home, About, Blog (index, `page/N`, `category/X`, posts), Contact, Privacy, RSS, 404 |
| `src/content/blog/` | Blog posts as Markdown (`YYYY-MM-DD-slug.md`) |
| `src/content.config.ts` | Frontmatter schema for posts |
| `src/consts.ts` | Site metadata, nav, social links, book + retailer links |
| `src/data/categories.json` | Category choices for the blog editor (edited in `/admin` → Settings) |
| `src/components/` | Page sections, `NewsletterForm.tsx` (Kit), `ContactForm.tsx`, `Analytics.astro` (cookie banner + GA4/Pixel) |
| `src/assets/` | Headshot and book cover (auto-optimized at build) |
| `public/admin/` | Decap CMS editor (`config.yml` defines the blog fields) |
| `public/uploads/` | Blog images uploaded through the editor |
| `api/` | Vercel functions: `auth.js` + `callback.js` (GitHub login for the editor), `contact.js` (Resend) |
| `vercel.json` | Redirects from the old Tertulia URLs, security headers |

## Setup

Requires Node 20+.

```bash
npm install
cp .env.example .env.local     # fill in values (see below)
npm run dev                    # http://localhost:4321
npm run build && npm run preview
```

`npm run dev` serves the site but **not** the `/api` functions. To test the contact form and editor login locally, use the Vercel CLI: `npx vercel dev`.

### Environment variables

| Variable | Used by | Notes |
|---|---|---|
| `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET` | `/api/auth`, `/api/callback` | GitHub OAuth App (see below) |
| `OAUTH_STATE_SECRET` | OAuth | Optional; signs the login `state`. Defaults to the client secret |
| `SITE_URL` | OAuth | Optional; forces the callback origin (default: request host) |
| `RESEND_API_KEY` | `/api/contact` | Set by the Vercel Resend integration |
| `RESEND_EMAIL_DOMAIN` | `/api/contact` | Set by the integration. The form sends as `contact@<domain>` |
| `CONTACT_FROM_EMAIL` | `/api/contact` | Optional. Overrides the sender, e.g. `Website Contact Form <contact@mjkalous.com>` |
| `CONTACT_TO_EMAIL` | `/api/contact` | Defaults to `michael@mjkalous.com` |
| `GA_MEASUREMENT_ID` | build | `G-XXXXXXX`. Blank = no GA |
| `META_PIXEL_ID` | build | Blank = no Pixel |
| `KIT_FORM_ID` | build | Numeric Kit form ID. Defaults to `9992996`; set only to use a different form |

The site's own forms post straight to Kit's form endpoint (`app.kit.com/forms/<id>/subscriptions`). Kit's JavaScript embed isn't used.

`GA_MEASUREMENT_ID`, `META_PIXEL_ID`, and `KIT_FORM_ID` are baked in at build time. After you change them in Vercel, redeploy.

## Blog editor (for Michael)

1. Go to **https://mjkalous.com/admin** and click **Login with GitHub**. You need a GitHub account with write access to this repository.
2. **New Blog Post** → fill in the title, date, categories, optional image and excerpt, then write the post.
3. **Publish** saves the post straight to GitHub. Vercel rebuilds the site automatically, and the post is live in about a minute.
4. To edit or delete a post, open it from the list. Tick **Draft** to hide a post without deleting it.

Tips: the **Excerpt** is the short summary shown on post cards and in Google results. The **Hero Image Description** is read aloud by screen readers, so describe what's in the picture.

**Editing locally, without logging in to GitHub:** run `npm run dev` and `npm run cms` in two terminals, then open http://localhost:4321/admin/. Changes are written to files on disk.

Links to other sites in a post open in a new tab automatically (`src/lib/external-links-plugin.mjs`). In page templates, give external links `target="_blank" rel="noopener"` and a `<span class="sr-only"> (opens in a new tab)</span>`.

To add or rename a category, go to **Settings → Categories** in `/admin` (stored in `src/data/categories.json`). New categories get their own page on the site as soon as a post uses one. Renaming a category doesn't update posts that already use the old name; edit those posts too.

## Analytics & privacy

- GA4 and the Meta Pixel load **only after a visitor clicks Accept** on the cookie banner. The banner only appears when at least one ID is set.
- Tracked events: `book_click` (retailer/Get the Book buttons → Pixel `ViewContent`), `sign_up` (newsletter → Pixel `CompleteRegistration`), `generate_lead` (contact form → Pixel `Lead`), `share`, `social_click`.
- To track another link, add `data-track="event_name"` (and optionally `data-track-label="..."`).
- The privacy policy lives at `src/pages/privacy.astro`. Update it whenever you add a tracking service.

## Deployment

1. Push to GitHub, then in Vercel choose **Add New → Project** and import the repo. It auto-detects Astro, and the `api/` folder deploys as serverless functions.
2. Add the environment variables above (Production and Preview).
3. Every push to `main` deploys. Posts published from `/admin` are commits to `main`, so they deploy too.
4. For the custom domain and DNS, see [INFRASTRUCTURE.md](INFRASTRUCTURE.md).

Note on branch protection: if `main` requires PR reviews, the CMS can't commit to it directly. Either exempt the CMS or turn on Decap's `publish_mode: editorial_workflow`, which opens a PR for each post.

## Domain Management (Namecheap + Vercel DNS)

The domain is **registered at Namecheap**, and its **DNS is hosted by Vercel** (nameservers `ns1.vercel-dns.com` / `ns2.vercel-dns.com`). Cloudflare and Name.com are no longer used.

**To change DNS records** (website, email, verification records):
1. Go to Vercel → **Domains** → mjkalous.com (or the project → Settings → Domains).
2. Add or edit records there. Changes in Namecheap's "Advanced DNS" tab have no effect while the nameservers point at Vercel.

You won't need to touch this unless we're updating the site or changing email settings. If anything looks confusing, send me a message and I'll handle it.

**Domain renewal:** Paid through **April 29, 2028**. Namecheap's free WithheldForPrivacy is active through **October 12, 2027**. The domain is currently in Allen's Namecheap account; it moves to an account for Michael after the 60-day post-transfer lock (see [INFRASTRUCTURE.md](INFRASTRUCTURE.md#handoff-transferring-to-michael)).

For the current DNS records, see [INFRASTRUCTURE.md](INFRASTRUCTURE.md#dns-vercel).

## GitHub OAuth (blog editor login)

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
   - Application name: `Michael Kalous Site`
   - Homepage URL: `https://mjkalous.com`
   - Authorization callback URL: `https://mjkalous.com/api/callback`
2. Copy the **Client ID**, generate a **Client Secret**, and add both to Vercel as `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET`.
3. Make sure `repo:` in `public/admin/config.yml` matches the GitHub `<owner>/<repo>`.

How it works: `/api/auth` redirects to GitHub with a `state` value made of a random nonce, a timestamp, and an HMAC-SHA256 signature. The nonce is also stored in an HttpOnly cookie. `/api/callback` checks the signature in constant time, rejects anything older than 10 minutes or whose cookie doesn't match, exchanges the code for a token, and passes it to the `/admin` window using Decap's `postMessage` handshake, locked to the site's own origin.

Login only works on the domain registered as the callback URL, so it won't work on Vercel preview URLs.

## Handoff

See [INFRASTRUCTURE.md](INFRASTRUCTURE.md#handoff-transferring-to-michael) for how to transfer the repo, Vercel project, domain, OAuth app, and analytics to Michael.
