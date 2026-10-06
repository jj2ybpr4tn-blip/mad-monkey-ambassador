import { isAdmin, listEntrants } from "@/lib/admin";
import type { NextRequest } from "next/server";

const csvCell = (v: unknown) => {
  const s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) return new Response("Not signed in", { status: 401 });
  const q = request.nextUrl.searchParams;
  const rows = await listEntrants({
    uni: q.get("uni") ?? undefined,
    year: q.get("year") ?? undefined,
    status: q.get("status") ?? undefined,
    minEntries: Number(q.get("minEntries") ?? 0),
    minReferrals: Number(q.get("minReferrals") ?? 0),
    q: q.get("q") ?? undefined,
  });
  const header = ["whatsapp", "whatsapp_verified_at", "in_draws_since", "first_name", "last_name", "email", "instagram", "declared_follow", "university", "source", "referral_code", "entries_this_term", "confirmed_referrals", "created_at"];
  const lines = rows.map((r) =>
    [r.whatsapp, r.whatsappVerifiedAt, r.enteredAt, r.firstName, r.lastName, r.email, r.instagramHandle, r.declaredFollow, r.university.slug, r.source, r.referralCode, r.entryTotal, r.referralTotal, r.createdAt].map(csvCell).join(","),
  );
  return new Response([header.join(","), ...lines].join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="entrants-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
