"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyWhatsApp } from "@/lib/giveaway";
import { siteUrl } from "@/lib/site";

/**
 * Demo stand-in for the WhatsApp webhook. In production this runs when the
 * message actually arrives, with the sender's real number and profile name.
 */
export async function demoWhatsAppSent(form: FormData) {
  const me = await db.entrant.findUnique({ where: { token: String(form.get("t") ?? "") }, include: { university: true } });
  if (!me) redirect("/");
  const profileName = String(form.get("profileName") ?? "").trim().slice(0, 60) || undefined;
  const result = await verifyWhatsApp(me.id, { number: me.whatsapp ?? "", profileName }, await siteUrl());
  redirect(`/${me.university.slug}/me?t=${me.token}${result.ok ? "&welcome=1" : "&err=whatsapp-taken"}`);
}
