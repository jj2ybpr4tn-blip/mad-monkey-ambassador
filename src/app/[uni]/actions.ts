"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { privateToken, REFERRAL_CODE_PATTERN } from "@/lib/codes";
import { newVerifyCode } from "@/lib/giveaway";
import { sendWhatsApp } from "@/lib/mail";
import { clientIp, siteUrl } from "@/lib/site";
import { isLoopback, ukMobile } from "@/lib/validate";

export type SignupState = { error?: string; notice?: string; whatsapp?: string };

const SIGNUPS_PER_IP_PER_HOUR = 5;

/**
 * The whole sign-up: a UK WhatsApp number. The uni comes from the link or QR
 * code, and tapping Enter accepts the T&Cs (18+, WhatsApp messages included).
 * Next stop is the one-tap WhatsApp verify.
 */
export async function signUp(_prev: SignupState, form: FormData): Promise<SignupState> {
  const v = (k: string) => String(form.get(k) ?? "").trim();
  const typed = v("whatsapp");

  const uni = await db.university.findUnique({ where: { slug: v("uni") } });
  if (!uni || !uni.isLive) return { error: "That uni isn't live yet.", whatsapp: typed };

  const whatsapp = ukMobile(typed);
  if (!whatsapp) return { error: "That doesn't look like a UK mobile. Try 07700 900123.", whatsapp: typed };

  const base = await siteUrl();
  const jar = await cookies();
  const remember = (token: string) => jar.set("mm_me", token, { maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true, path: "/" });

  // Already in: send their link on WhatsApp rather than making a second entry.
  const entered = await db.entrant.findFirst({ where: { whatsapp, whatsappVerifiedAt: { not: null } }, include: { university: true } });
  if (entered) {
    await sendWhatsApp({
      to: whatsapp,
      subject: "You're already in",
      body: "Here's your link to see your entries and share with your mates.",
      ctaLabel: "SEE MY ENTRIES",
      ctaUrl: `${base}/${entered.university.slug}/me?t=${entered.token}`,
    });
    return { notice: "You're already in! We've sent your link on WhatsApp.", whatsapp: typed };
  }

  // Started before but never verified: pick up where they left off.
  const unfinished = await db.entrant.findFirst({ where: { whatsapp, universityId: uni.id, whatsappVerifiedAt: null } });
  if (unfinished) {
    remember(unfinished.token);
    redirect(`/verify/whatsapp?t=${unfinished.token}`);
  }

  const ip = await clientIp();
  // Rate limit by IP. Skipped on localhost so the demo can be clicked through.
  if (!isLoopback(ip)) {
    const recent = await db.entrant.count({ where: { ip, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } } });
    if (recent >= SIGNUPS_PER_IP_PER_HOUR) return { error: "Too many sign-ups from this connection. Give it an hour.", whatsapp: typed };
  }

  // Referral: hidden field first, then the 30-day cookie. Nobody refers themselves.
  const code = (v("ref") || jar.get("mm_ref")?.value || "").toUpperCase();
  const found = REFERRAL_CODE_PATTERN.test(code) ? await db.entrant.findFirst({ where: { referralCode: code } }) : null;
  const referrer = found && found.whatsapp !== whatsapp ? found : null;

  const token = privateToken();
  const entrant = await db.entrant.create({
    data: {
      token,
      whatsapp,
      universityId: uni.id,
      over18: true, // confirmed by entering, per the T&Cs
      whatsappConsent: true, // part of the T&Cs; they can reply STOP any time
      verifyCode: newVerifyCode(),
      source: (v("src") || jar.get("mm_src")?.value || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) || null,
      referredById: referrer?.id,
      ip,
      userAgent: (await headers()).get("user-agent"),
    },
  });
  if (referrer) await db.referral.create({ data: { kind: "giveaway", referrerId: referrer.id, refereeId: entrant.id } });

  remember(token);
  redirect(`/verify/whatsapp?t=${token}`);
}
