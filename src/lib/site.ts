import { headers } from "next/headers";

export async function siteUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3100";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? "::1";
}

/** "Olivia S." when we have a name (from WhatsApp or a booking), else the end of their number. */
export function displayName(e: { firstName: string | null; lastName: string | null; whatsapp?: string | null }) {
  if (e.firstName) return `${e.firstName}${e.lastName ? ` ${e.lastName.charAt(0).toUpperCase()}.` : ""}`;
  return e.whatsapp ? `Number ending ${e.whatsapp.slice(-3)}` : "Someone";
}

export function shortUniName(name: string) {
  return name.replace(/^University of /, "").replace(/ University$/, "");
}
