// Contact and speaking-request forms → email to Michael via Resend (https://resend.com/docs/api-reference/emails/send-email).
import { createHash } from 'node:crypto';
import { siteOrigin } from './_utils.js';
import { checkBotId } from 'botid/server';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LIMITS = { name: 100, email: 200, message: 5000 };

// Extra fields sent by the speaking-request form (`form: 'speaking'`): [key, label, max length].
const SPEAKING_FIELDS = [
  ['organization', 'Organization', 200],
  ['phone', 'Phone', 50],
  ['eventDate', 'Event date', 100],
  ['location', 'Location', 200],
  ['format', 'Format', 50],
  ['audience', 'Audience', 300],
  ['topic', 'Topic', 300],
  ['budget', 'Honorarium / budget', 200],
];

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Strip CR/LF so user input can never inject extra email headers via the subject.
const oneLine = (s) => s.replace(/[\r\n]+/g, ' ');

export default function handler(req, res) {
  return handleContact(req, res);
}

export async function handleContact(req, res, verifyBot = checkBotId) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const contentType = req.headers['content-type']?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return res.status(415).json({ error: 'Please submit the form as JSON.' });
  }
  const origin = req.headers.origin;
  const localDevelopment = process.env.VERCEL_ENV === 'development' ||
    (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production');
  const localOrigin = localDevelopment && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
  const previewOrigin = process.env.VERCEL_ENV === 'preview' &&
    [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter(Boolean).some((host) => origin === `https://${host}`);
  if ((origin && origin !== siteOrigin(req) && !localOrigin && !previewOrigin) || req.headers['sec-fetch-site'] === 'cross-site') {
    return res.status(403).json({ error: 'Please submit the form from mjkalous.com.' });
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid form submission.' });
  }
  // Vercel parses JSON before this handler; also bound the parsed payload, including unknown fields.
  if (Buffer.byteLength(JSON.stringify(req.body), 'utf8') > 24_000) {
    return res.status(413).json({ error: 'That message is too large. Please shorten it and try again.' });
  }
  const body = req.body;
  const fields = ['name', 'email', 'message', 'form', 'website', ...SPEAKING_FIELDS.map(([key]) => key)];
  if (fields.some((key) => body[key] != null && typeof body[key] !== 'string')) {
    return res.status(400).json({ error: 'Invalid form fields.' });
  }
  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim();
  const message = (body.message ?? '').trim();
  const speaking = body.form === 'speaking';
  const details = speaking
    ? SPEAKING_FIELDS.map(([key, label, max]) => ({ label, max, value: (body[key] ?? '').trim() }))
    : [];
  const organization = details.find((d) => d.label === 'Organization')?.value ?? '';

  // Honeypot filled in: pretend success so bots don't retry.
  if (body.website) return res.status(200).json({ ok: true });

  if (!name || !email || !message) return res.status(400).json({ error: 'Please fill in your name, email, and message.' });
  if (speaking && !organization) return res.status(400).json({ error: 'Please tell us your organization.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    message.length > LIMITS.message ||
    details.some((d) => d.value.length > d.max)
  ) {
    return res.status(400).json({ error: 'That message is a little too long. Please shorten it and try again.' });
  }

  try {
    const result = await verifyBot({
      // Never let a missing NODE_ENV accidentally bypass checks on Vercel.
      developmentOptions: { isDevelopment: localDevelopment },
      advancedOptions: { checkLevel: 'basic', headers: req.headers },
    });
    if (result.isBot !== false) {
      return res.status(403).json({ error: 'We could not verify your browser. Please refresh and try again, or email michael@mjkalous.com.' });
    }
  } catch {
    console.error('contact: browser verification unavailable');
    return res.status(503).json({ error: 'Browser verification is temporarily unavailable. Please try again, or email michael@mjkalous.com.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('contact: RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'The contact form is not configured yet. Please email michael@mjkalous.com.' });
  }

  const to = process.env.CONTACT_TO_EMAIL || 'michael@mjkalous.com';
  // Must be an address on a domain verified in Resend. RESEND_EMAIL_DOMAIN is set by the Vercel Resend
  // integration. onboarding@resend.dev (last resort) only delivers to the Resend account owner.
  const domain = process.env.RESEND_EMAIL_DOMAIN;
  const from =
    process.env.CONTACT_FROM_EMAIL ||
    (domain ? `Website Contact Form <contact@${domain}>` : 'Website Contact Form <onboarding@resend.dev>');

  const filled = details.filter((d) => d.value);
  const subject = speaking
    ? `Speaking request from ${name}${organization ? ` (${organization})` : ''} via mjkalous.com`
    : `New message from ${name} via mjkalous.com`;
  const formName = speaking ? 'speaking request form' : 'contact form';
  const detailsText = filled.map((d) => `${d.label}: ${d.value}\n`).join('');
  const detailsHtml = filled.map((d) => `<br><strong>${d.label}:</strong> ${escapeHtml(d.value)}`).join('');

  try {
    const payload = {
      from,
      to: [to],
      reply_to: email,
      subject: oneLine(subject),
      text: `Name: ${name}\nEmail: ${email}\n${detailsText}\n${message}\n\n— Sent from the ${formName} on mjkalous.com. Reply to this email to respond.`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}${detailsHtml}</p>
<p style="white-space:pre-wrap">${escapeHtml(message)}</p>
<hr><p style="color:#777;font-size:13px">Sent from the ${formName} on mjkalous.com. Reply to this email to respond.</p>`,
    };
    const serialized = JSON.stringify(payload);
    // Resend deduplicates identical submissions for 24 hours.
    const idempotencyKey = `contact/${createHash('sha256').update(serialized).digest('hex')}`;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: serialized,
    });
    if (!r.ok) {
      console.error('contact: email provider rejected request', r.status);
      return res.status(502).json({ error: 'Your message could not be sent. Please try again, or email michael@mjkalous.com.' });
    }
    return res.status(200).json({ ok: true });
  } catch {
    console.error('contact: email provider request failed');
    return res.status(502).json({ error: 'Your message could not be sent. Please try again, or email michael@mjkalous.com.' });
  }
}
