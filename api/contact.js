// Contact and speaking-request forms → email to Michael via Resend (https://resend.com/docs/api-reference/emails/send-email).
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
  const speaking = body.form === 'speaking';
  const details = speaking
    ? SPEAKING_FIELDS.map(([key, label, max]) => ({ label, max, value: String(body[key] ?? '').trim() }))
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
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: oneLine(subject),
        text: `Name: ${name}\nEmail: ${email}\n${detailsText}\n${message}\n\n— Sent from the ${formName} on mjkalous.com. Reply to this email to respond.`,
        html: `<p><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}${detailsHtml}</p>
<p style="white-space:pre-wrap">${escapeHtml(message)}</p>
<hr><p style="color:#777;font-size:13px">Sent from the ${formName} on mjkalous.com. Reply to this email to respond.</p>`,
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
