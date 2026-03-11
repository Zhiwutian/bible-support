const DEVICE_ID_KEY = 'bible-support-device-id';

/** Return a stable per-browser device id used for anonymous saves. */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server-device';
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const generated = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}
