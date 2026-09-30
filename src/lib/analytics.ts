// GA4 + Meta Pixel, loaded only after the visitor accepts the cookie banner.
// Anywhere on the site can call `track()`; it's a no-op until consent is given
// and when the IDs aren't configured.
import { GA_MEASUREMENT_ID, META_PIXEL_ID } from 'astro:env/client';

const CONSENT_KEY = 'mjk-consent';
export type Consent = 'granted' | 'denied';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export const analyticsConfigured = Boolean(GA_MEASUREMENT_ID || META_PIXEL_ID);

export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* storage blocked: the choice just won't be remembered */
  }
  if (value === 'granted') loadAnalytics();
}

let loaded = false;

export function loadAnalytics() {
  if (loaded || !analyticsConfigured) return;
  loaded = true;

  if (GA_MEASUREMENT_ID) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // gtag requires the real `arguments` object, not a spread array.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
  }

  if (META_PIXEL_ID) {
    // Standard Meta Pixel bootstrap, de-minified.
    const fbq: any = function (...args: unknown[]) {
      fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args);
    };
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }
}

/** Meta standard events we map GA event names onto. */
const META_EVENT: Record<string, string> = {
  sign_up: 'CompleteRegistration',
  generate_lead: 'Lead',
  book_click: 'ViewContent',
};

export function track(event: string, params: Record<string, string | number> = {}) {
  if (!loaded) return;
  window.gtag?.('event', event, params);
  const metaEvent = META_EVENT[event];
  if (metaEvent) window.fbq?.('track', metaEvent, params);
  else window.fbq?.('trackCustom', event, params);
}
