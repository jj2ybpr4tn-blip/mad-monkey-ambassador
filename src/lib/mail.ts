import { db } from "./db";

type Message = { to: string; subject: string; body: string; ctaLabel?: string; ctaUrl?: string };

/**
 * Stubbed messaging. Nothing leaves the building: every message is written to
 * the outbox table and shown at /demo/inbox. In production, WhatsApp goes out
 * through Mad Monkey's WhatsApp Business number and email through a provider.
 */
async function send(channel: "whatsapp" | "email", msg: Message) {
  await db.outboxEmail.create({ data: { channel, ...msg } });
  console.log(`[${channel}] to=${msg.to} subject="${msg.subject}"${msg.ctaUrl ? ` cta=${msg.ctaUrl}` : ""}`);
}

export const sendEmail = (msg: Message) => send("email", msg);
export const sendWhatsApp = (msg: Message) => send("whatsapp", msg);

/** Email if we have their address, otherwise WhatsApp. Giveaway entrants only give a number. */
export async function notify(person: { email: string | null; whatsapp: string | null }, msg: Omit<Message, "to">) {
  if (person.email) return sendEmail({ ...msg, to: person.email });
  if (person.whatsapp) return sendWhatsApp({ ...msg, to: person.whatsapp });
}
