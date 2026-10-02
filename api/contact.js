// Contact form → email to Michael via Resend (https://resend.com/docs/api-reference/emails/send-email).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LIMITS = { name: 100, email: 200, message: 5000 };

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Strip CR/LF so user input can never inject extra email headers via the subject.
const oneLine = (s) => s.replace(/[\r\n]+/g, ' ');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const message = String(body.message ?? '').trim();

  // Honeypot filled in: pretend success so bots don't retry.
  if (body.website) return res.status(200).json({ ok: true });

  if (!name || !email || !message) return res.status(400).json({ error: 'Please fill in your name, email, and message.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (name.length > LIMITS.name || email.length > LIMITS.email || message.length > LIMITS.message) {
    return res.status(400).json({ error: 'That message is a little too long. Please shorten it and try again.' });
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

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: oneLine(`New message from ${name} via mjkalous.com`),
        text: `Name: ${name}\nEmail: ${email}\n\n${message}\n\n— Sent from the contact form on mjkalous.com. Reply to this email to respond.`,
        html: `<p><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}</p>
<p style="white-space:pre-wrap">${escapeHtml(message)}</p>
<hr><p style="color:#777;font-size:13px">Sent from the contact form on mjkalous.com. Reply to this email to respond.</p>`,
      }),
    });
    if (!r.ok) {
      console.error('contact: Resend error', r.status, await r.text());
      return res.status(502).json({ error: 'Your message could not be sent. Please try again, or email michael@mjkalous.com.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact: request failed', err);
    return res.status(502).json({ error: 'Your message could not be sent. Please try again, or email michael@mjkalous.com.' });
  }
}
