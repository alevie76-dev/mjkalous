import { useId, useState, type FormEvent } from 'react';
import { KIT_FORM_ID } from 'astro:env/client';
import { track } from '../lib/analytics';

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface Props {
  /** "dark" for use on the sage background, "light" for paper/white. */
  tone?: 'light' | 'dark';
  /** Where on the site this form sits, for analytics. */
  placement: string;
}

const kitAction = KIT_FORM_ID ? `https://app.kit.com/forms/${encodeURIComponent(KIT_FORM_ID)}/subscriptions` : undefined;

export default function NewsletterForm({ tone = 'light', placement }: Props) {
  const id = useId();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!kitAction) {
      setStatus('error');
      setMessage('Newsletter signup is almost ready. Please check back soon.');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch(kitAction, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || (data.status && data.status !== 'success')) throw new Error('rejected');
      setStatus('success');
      setMessage('Thank you! Please check your inbox to confirm your subscription.');
      track('sign_up', { method: 'newsletter', placement });
      form.reset();
    } catch (err) {
      if (err instanceof TypeError) {
        // Network/CORS failure: fall back to a normal form post to Kit.
        form.submit();
        return;
      }
      setStatus('error');
      setMessage('Something went wrong. Please check your email address and try again.');
    }
  }

  const dark = tone === 'dark';
  const labelCls = `label ${dark ? 'text-white' : ''}`;

  if (status === 'success') {
    return (
      <p role="status" className={`rounded-lg px-4 py-3 font-medium ${dark ? 'bg-white/10 text-white' : 'bg-sage/10 text-sage-dark'}`}>
        {message}
      </p>
    );
  }

  return (
    <form action={kitAction} method="post" onSubmit={onSubmit} className="w-full">
      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
        <div>
          <label htmlFor={`${id}-name`} className={labelCls}>
            First name
          </label>
          <input id={`${id}-name`} name="fields[first_name]" type="text" autoComplete="given-name" className="field" />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className={labelCls}>
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${id}-email`}
            name="email_address"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            className="field"
          />
        </div>
        <button type="submit" disabled={status === 'submitting'} className={`btn ${dark ? 'bg-white text-sage-dark hover:bg-sand' : 'btn-primary'} disabled:opacity-60`}>
          {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
      <p className={`mt-3 text-sm ${dark ? 'text-white/85' : 'text-muted'}`}>
        We respect your privacy. Unsubscribe at any time.
      </p>
      <p role="alert" className={`mt-2 text-sm font-medium ${dark ? 'text-white' : 'text-clay'}`}>
        {status === 'error' ? message : ''}
      </p>
    </form>
  );
}
