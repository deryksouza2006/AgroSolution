/** Only ordinary HTTP(S) source links may be passed to the operating system. */
export function safeSourceUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value) || /[\u0000-\u0020\u007f\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
    return value;
  } catch { return null; }
}
