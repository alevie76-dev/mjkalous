import { useState, type FormEvent } from 'react';
import { track } from '../lib/analytics';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    setStatus('submitting');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Your message could not be sent.');
      setStatus('success');
      track('generate_lead', { method: 'contact_form' });
      form.reset();
    } catch (err) {
      setStatus('error');
      setError(
        err instanceof Error && err.message !== 'Failed to fetch'
          ? err.message
          : 'Your message could not be sent. Please try again, or email michael@mjkalous.com directly.',
      );
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className="rounded-2xl border border-sage/30 bg-sage/10 p-6 text-sage-dark">
        <p className="font-serif text-2xl">Thanks for reaching out.</p>
        <p className="mt-1">I'll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="contact-name" className="label">
          Name <span aria-hidden="true">*</span>
        </label>
        <input id="contact-name" name="name" type="text" required maxLength={100} autoComplete="name" className="field" />
      </div>
      <div>
        <label htmlFor="contact-email" className="label">
          Email <span aria-hidden="true">*</span>
        </label>
        <input id="contact-email" name="email" type="email" required maxLength={200} autoComplete="email" className="field" />
      </div>
      <div>
        <label htmlFor="contact-message" className="label">
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea id="contact-message" name="message" required rows={6} maxLength={5000} className="field min-h-40 resize-y" />
      </div>
      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <p role="alert" className="text-sm font-medium text-clay empty:hidden">
        {status === 'error' ? error : ''}
      </p>
      <button type="submit" disabled={status === 'submitting'} className="btn btn-primary w-full sm:w-auto disabled:opacity-60">
        {status === 'submitting' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}
