"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { addInstagram, recordStoryShare } from "@/lib/giveaway";
import { cleanHandle } from "@/lib/validate";

async function entrantFrom(form: FormData) {
  const me = await db.entrant.findUnique({ where: { token: String(form.get("t") ?? "") }, include: { university: true } });
  if (!me) redirect("/");
  return me;
}

/** Optional Instagram, for the follow entry and weekly story entries. */
export async function addInstagramAction(form: FormData) {
  const me = await entrantFrom(form);
  const back = `/${me.university.slug}/me?t=${me.token}`;
  const handle = cleanHandle(String(form.get("instagram") ?? ""));
  if (!/^[a-z0-9._]{1,30}$/.test(handle)) redirect(`${back}&err=instagram-bad`);
  const result = await addInstagram(me.id, handle, form.get("follow") === "on");
  redirect(result.ok ? back : `${back}&err=instagram-taken`);
}

/** Demo stand-in for Instagram's story-mention webhook. */
export async function demoStoryTag(form: FormData) {
  const me = await entrantFrom(form);
  const result = await recordStoryShare(me.id);
  redirect(`/${me.university.slug}/me?t=${me.token}&story=${result}`);
}
