import { useState, type FormEvent } from 'react';
import { track } from '../lib/analytics';
import { SPEAKING_TOPICS } from '../consts';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function SpeakingForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = { ...Object.fromEntries(new FormData(form)), form: 'speaking' };
    setStatus('submitting');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Your request could not be sent.');
      setStatus('success');
      track('generate_lead', { method: 'speaking_form' });
      form.reset();
    } catch (err) {
      setStatus('error');
      setError(
        err instanceof Error && err.message !== 'Failed to fetch'
          ? err.message
          : 'Your request could not be sent. Please try again, or email michael@mjkalous.com directly.',
      );
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className="rounded-2xl border border-sage/30 bg-sage/10 p-6 text-sage-dark">
        <p className="font-serif text-2xl">Thank you for the invitation.</p>
        <p className="mt-1">Michael will be in touch soon to talk about your event.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="speaking-name" className="label">
            Your name <span aria-hidden="true">*</span>
          </label>
          <input id="speaking-name" name="name" type="text" required maxLength={100} autoComplete="name" className="field" />
        </div>
        <div>
          <label htmlFor="speaking-organization" className="label">
            Organization <span aria-hidden="true">*</span>
          </label>
          <input id="speaking-organization" name="organization" type="text" required maxLength={200} autoComplete="organization" className="field" />
        </div>
        <div>
          <label htmlFor="speaking-email" className="label">
            Email <span aria-hidden="true">*</span>
          </label>
          <input id="speaking-email" name="email" type="email" required maxLength={200} autoComplete="email" className="field" />
        </div>
        <div>
          <label htmlFor="speaking-phone" className="label">Phone</label>
          <input id="speaking-phone" name="phone" type="tel" maxLength={50} autoComplete="tel" className="field" />
        </div>
        <div>
          <label htmlFor="speaking-date" className="label">Event date</label>
          <input id="speaking-date" name="eventDate" type="text" maxLength={100} placeholder="e.g. March 2027" className="field" />
        </div>
        <div>
          <label htmlFor="speaking-location" className="label">Location</label>
          <input id="speaking-location" name="location" type="text" maxLength={200} placeholder="City, state" className="field" />
        </div>
        <div>
          <label htmlFor="speaking-format" className="label">Format</label>
          <select id="speaking-format" name="format" className="field" defaultValue="">
            <option value="">Choose one</option>
            <option>In person</option>
            <option>Virtual</option>
            <option>Not sure yet</option>
          </select>
        </div>
        <div>
          <label htmlFor="speaking-topic" className="label">Topic</label>
          <select id="speaking-topic" name="topic" className="field" defaultValue="">
            <option value="">Choose one</option>
            {SPEAKING_TOPICS.map((t) => (
              <option key={t.title}>{t.title}</option>
            ))}
            <option>Something else (describe below)</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="speaking-audience" className="label">Audience</label>
        <input id="speaking-audience" name="audience" type="text" maxLength={300} placeholder="Who will be there, and about how many?" className="field" />
      </div>
      <div>
        <label htmlFor="speaking-budget" className="label">Honorarium or budget</label>
        <input id="speaking-budget" name="budget" type="text" maxLength={200} placeholder="Optional" className="field" />
      </div>
      <div>
        <label htmlFor="speaking-message" className="label">
          Tell Michael about your event <span aria-hidden="true">*</span>
        </label>
        <textarea id="speaking-message" name="message" required rows={5} maxLength={5000} className="field min-h-32 resize-y" />
      </div>
      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="speaking-website">Website</label>
        <input id="speaking-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <p role="alert" className="text-sm font-medium text-clay empty:hidden">
        {status === 'error' ? error : ''}
      </p>
      <button type="submit" disabled={status === 'submitting'} className="btn btn-primary w-full sm:w-auto disabled:opacity-60">
        {status === 'submitting' ? 'Sending…' : 'Send Speaking Request'}
      </button>
    </form>
  );
}
