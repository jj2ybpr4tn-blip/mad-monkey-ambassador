const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "sharklasers.com", "10minutemail.com",
  "tempmail.com", "temp-mail.org", "yopmail.com", "trashmail.com", "getnada.com", "dispostable.com",
  "maildrop.cc", "throwawaymail.com", "fakeinbox.com", "mintemail.com", "emailondeck.com",
]);

/** Lowercase, and collapse Gmail dots and plus-tags so one inbox is one person. */
export function normaliseEmail(raw: string) {
  const email = raw.trim().toLowerCase();
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `${local.split("+")[0].replace(/\./g, "")}@gmail.com`;
  }
  return `${local.split("+")[0]}@${domain}`;
}

export function isEmail(raw: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

export function isDisposable(email: string) {
  return DISPOSABLE_DOMAINS.has(email.split("@")[1] ?? "");
}

/** UK mobile in any common shape → +447xxxxxxxxx, or null if it isn't one. */
export function ukMobile(raw: string) {
  const digits = raw.replace(/[\s\-()]/g, "");
  const m = digits.match(/^(?:\+44|0044|44|0)(7\d{9})$/);
  return m ? `+44${m[1]}` : null;
}

export function cleanHandle(raw: string) {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

export function isLoopback(ip: string | null | undefined) {
  return !ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("::ffff:127.");
}
