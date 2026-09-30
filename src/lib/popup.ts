// Remembers whether the newsletter popup should stay hidden for this visitor.
export const POPUP_DELAY_MS = 10_000;
const DISMISS_DAYS = 14;
const DISMISSED_KEY = 'mjk-popup-dismissed';
const SUBSCRIBED_KEY = 'mjk-subscribed';

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function set(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the popup may show again next visit */
  }
}

export function popupSuppressed(): boolean {
  if (get(SUBSCRIBED_KEY)) return true;
  const dismissed = Number(get(DISMISSED_KEY));
  return Boolean(dismissed) && Date.now() - dismissed < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function dismissPopup() {
  set(DISMISSED_KEY, String(Date.now()));
}

export function markSubscribed() {
  set(SUBSCRIBED_KEY, '1');
}
