import Link from "next/link";
import { redirect } from "next/navigation";
import { drawDate, longDate, monthLabel, termByKey, termDrawDate, termFor } from "@/lib/dates";
import { ENTRY_VALUES, giveawayLeaderboard, sharedStoryThisWeek, tally, type Tally } from "@/lib/giveaway";
import { currentEntrant, param } from "@/lib/me";
import { MONTHLY_PRIZE } from "@/lib/prizes";
import { shortUniName, siteUrl } from "@/lib/site";
import { bookedCount, recentBookedCount, spotsState } from "@/lib/trip";
import { Footer, Header } from "@/components/Chrome";
import { QrCode } from "@/components/QrCode";
import { ShareTools } from "@/components/ShareTools";
import { SpotsBoard } from "@/components/SpotsBoard";
import { addInstagramAction, demoStoryTag } from "./actions";

const ERRORS: Record<string, string> = {
  "whatsapp-taken": "That WhatsApp number is already in the giveaway. One entry per person.",
  "instagram-taken": "That Instagram account is already in the giveaway.",
  "instagram-bad": "Just your handle, like @yourname.",
};

export default async function MyEntries({
  params,
  searchParams,
}: {
  params: Promise<{ uni: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { uni: slug } = await params;
  const sp = await searchParams;
  const me = await currentEntrant(sp.t);
  if (!me) redirect(`/${slug}`);
  if (me.university.slug !== slug) redirect(`/${me.university.slug}/me`);
  const uni = me.university;
  const base = await siteUrl();

  return (
    <main className="mx-auto max-w-md px-4">
      <Header eyebrow={`${shortUniName(uni.name)} × Mad Monkey`} />
      {ERRORS[param(sp.err) ?? ""] && (
        <p role="alert" className="mt-4 border-3 border-orange p-3 font-semibold text-orange">
          {ERRORS[param(sp.err)!]}
        </p>
      )}

      {me.enteredAt ? (
        <Entered
          meId={me.id}
          token={me.token}
          firstName={me.firstName}
          instagram={me.instagramHandle}
          uni={uni}
          shareUrl={`${base}/${uni.slug}?r=${me.referralCode}`}
          story={param(sp.story)}
        />
      ) : (
        <section className="pt-6">
          <p className="eyebrow text-lime">Nearly there</p>
          <h1 className="display hero mt-2">One tap left.</h1>
          <p className="mt-4 text-lg font-medium">Send us one WhatsApp message and you&apos;re in both draws.</p>
          <Link href={`/verify/whatsapp?t=${me.token}`} className="btn btn-lime mt-8 w-full text-lg">
            Verify on WhatsApp →
          </Link>
        </section>
      )}

      <TripTeaser uni={uni} />
      <Footer />
    </main>
  );
}

async function Entered({
  meId,
  token,
  firstName,
  instagram,
  uni,
  shareUrl,
  story,
}: {
  meId: string;
  token: string;
  firstName: string | null;
  instagram: string | null;
  uni: { id: string; name: string; slug: string };
  shareUrl: string;
  story?: string;
}) {
  const term = termFor();
  const t = await tally(meId, undefined, term.key);
  const shared = await sharedStoryThisWeek(meId);
  const board = await giveawayLeaderboard(uni.id, term.key);
  const month = monthLabel(new Date().toISOString().slice(0, 7)).split(" ")[0];

  return (
    <>
      <p className="eyebrow mt-6 text-lime">WhatsApp verified</p>
      <h1 className="display hero mt-2">You&apos;re in{firstName ? `, ${firstName}` : ""}.</h1>

      <section className="mt-8 grid grid-cols-2 gap-3">
        <Total label={`${month} · 7 free nights`} n={t.month.total} sub={`Drawn ${longDate(drawDate())}`} />
        <Total label={`${termByKey(term.key).label} · free trip`} n={t.term.total} sub={`Drawn ${longDate(termDrawDate(term.key))}`} lime />
      </section>
      <Breakdown t={t} month={month} />

      {!instagram && (
        <section className="mt-10 border-3 border-dashed border-lime p-5">
          <p className="eyebrow text-lime">Optional · more entries</p>
          <h2 className="display mt-2 text-3xl">Add your Instagram.</h2>
          <p className="mt-2 font-medium">
            +{ENTRY_VALUES.follow} if you follow @madmonkeyhostels, and +{ENTRY_VALUES.story} every week you share our post to your story.
          </p>
          <form action={addInstagramAction} className="mt-4">
            <input type="hidden" name="t" value={token} />
            <span className="flex">
              <span className="grid place-content-center border-3 border-r-0 border-bone px-3 font-black">@</span>
              <input
                name="instagram"
                className="field"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="yourhandle"
                aria-label="Instagram handle"
              />
            </span>
            <label className="mt-3 flex cursor-pointer items-start gap-3 font-medium">
              <input type="checkbox" name="follow" className="check mt-0.5" />
              <span>
                I follow @madmonkeyhostels <span className="text-xs text-bone/70">(we check the winner)</span>
              </span>
            </label>
            <button className="btn btn-lime btn-sm mt-4 w-full">Add it →</button>
          </form>
        </section>
      )}

      {instagram && (
        <section className="card mt-10 p-5">
          <p className="eyebrow">Every week · +{ENTRY_VALUES.story}</p>
          <h2 className="display mt-2 text-3xl">Share the post to your story.</h2>
          <p className="mt-2 font-medium">
            Share your ambassador&apos;s post of the week to your story and tag <b>@madmonkeyhostels</b>. Instagram tells us, and your entries go on
            automatically.
          </p>
          {story === "added" && <p className="mt-3 bg-ink px-3 py-2 font-bold text-lime">Spotted it. +{ENTRY_VALUES.story} entries.</p>}
          {shared ? (
            <p className="mt-4 font-black uppercase">✓ Done this week. Next one from Monday.</p>
          ) : (
            <form action={demoStoryTag} className="mt-4">
              <input type="hidden" name="t" value={token} />
              <p className="text-sm font-semibold">Not spotted yet this week.</p>
              <button className="mt-2 w-full border-3 border-dashed border-ink py-2 text-sm font-bold">Demo: pretend you tagged us</button>
            </form>
          )}
          <p className="mt-3 text-xs font-semibold opacity-70">Matched to @{instagram}.</p>
        </section>
      )}

      <section className="card mt-10 p-5">
        <p className="eyebrow">Every mate · +{ENTRY_VALUES.referral}</p>
        <h2 className="display mt-2 text-3xl">Get your mates in.</h2>
        <p className="mt-2 mb-5 font-medium">Every mate who enters on your link and verifies their WhatsApp is 5 more entries. No limit.</p>
        <ShareTools url={shareUrl} message="Want to win a free trip to SE Asia? Just pop your WhatsApp in, do it on my link:" />
        <div className="mt-2 flex items-center gap-4 border-t-3 border-ink pt-4">
          <QrCode value={shareUrl} size={120} label="QR code for your share link" />
          <p className="text-sm font-semibold">With them in person? Let them scan this.</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="display text-3xl">{shortUniName(uni.name)} top ten</h2>
        <p className="mt-1 text-sm text-bone/70">Most mates brought in this term.</p>
        {board.length === 0 ? (
          <p className="mt-4 font-medium">Nobody on the board yet. First mate in takes the top spot.</p>
        ) : (
          <ol className="mt-4 border-t-3 border-bone">
            {board.map((r, i) => (
              <li key={r.id} className={`flex items-center gap-3 border-b-2 border-bone/25 py-2.5 ${r.id === meId ? "bg-lime px-2 text-ink" : ""}`}>
                <span className="display w-7 text-xl">{i + 1}</span>
                <span className="flex-1 font-semibold">
                  {r.name}
                  {r.id === meId && " (you)"}
                </span>
                <span className="font-black">{r.mates}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
      <p className="mt-6 text-xs text-bone/70">Monthly prize: {MONTHLY_PRIZE}. We check the winner follows @madmonkeyhostels before announcing.</p>
    </>
  );
}

function Total({ label, n, sub, lime }: { label: string; n: number; sub: string; lime?: boolean }) {
  return (
    <div className={`border-3 p-3 ${lime ? "border-lime" : "border-bone"}`}>
      <p className="eyebrow leading-snug">{label}</p>
      <p className={`display mt-1 text-6xl ${lime ? "text-lime" : ""}`}>{n}</p>
      <p className="mt-1 text-xs font-semibold text-bone/70">{sub}</p>
    </div>
  );
}

function Breakdown({ t, month }: { t: Tally; month: string }) {
  const rows: [string, number, number][] = [
    ["Verified", t.standing - t.follow, t.standing - t.follow],
    ["Following @madmonkeyhostels", t.follow, t.follow],
    ["Mates on your link", t.month.referral, t.term.referral],
    ["Story shares", t.month.story, t.term.story],
  ];
  return (
    <table className="mt-5 w-full text-sm">
      <thead>
        <tr className="border-b-3 border-bone">
          <th className="eyebrow py-2 text-left"></th>
          <th className="eyebrow py-2 pl-4 text-right">{month}</th>
          <th className="eyebrow py-2 pl-4 text-right">Term</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, m, term]) => (
          <tr key={label} className="border-b-2 border-bone/25">
            <td className={`py-2.5 font-medium ${term ? "" : "text-bone/50"}`}>{label}</td>
            <td className={`py-2.5 text-right font-black ${m ? "text-lime" : "text-bone/50"}`}>+{m}</td>
            <td className={`py-2.5 text-right font-black ${term ? "text-lime" : "text-bone/50"}`}>+{term}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Quiet cross-sell to the trip site. */
async function TripTeaser({
  uni,
}: {
  uni: {
    id: string;
    name: string;
    slug: string;
    destination: string;
    softCap: number;
    hardCap: number;
    hardCapReleased: boolean;
  };
}) {
  const spots = spotsState(uni, await bookedCount(uni.id));
  return (
    <section className="mt-14">
      <p className="mb-3 font-semibold">Don&apos;t want to leave it to luck? {shortUniName(uni.name)}&apos;s end-of-year trip is open.</p>
      <SpotsBoard spots={spots} eyebrow={`${shortUniName(uni.name)} → ${uni.destination}`} recent={await recentBookedCount(uni.id)} size="sm">
        <Link href={`/trip/${uni.slug}`} className="mt-3 inline-block font-bold underline underline-offset-4">
          See the trip →
        </Link>
      </SpotsBoard>
    </section>
  );
}
