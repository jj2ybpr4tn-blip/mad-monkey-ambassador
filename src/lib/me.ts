import { cookies } from "next/headers";
import { db } from "./db";

/** Who is looking: a ?t= private link first, then the cookie set on sign-up. */
export async function currentEntrant(tParam?: string | string[]) {
  const token = (typeof tParam === "string" ? tParam : undefined) ?? (await cookies()).get("mm_me")?.value;
  if (!token) return null;
  return db.entrant.findUnique({ where: { token }, include: { university: true } });
}

export function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}
