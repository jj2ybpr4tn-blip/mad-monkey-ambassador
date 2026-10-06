"use client";

import { useState } from "react";

/** Share link with one-tap copy, plus WhatsApp and Instagram Stories with the message pre-written. */
export function ShareTools({ url, message }: { url: string; message: string }) {
  const [toast, setToast] = useState<string | null>(null);
  const flash = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2600);
  };
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div>
      <div className="flex border-3 border-ink">
        <input readOnly value={url.replace(/^https?:\/\//, "")} aria-label="Your share link" className="min-w-0 flex-1 bg-paper px-3 py-3 font-bold text-ink" onFocus={(e) => e.currentTarget.select()} />
        <button type="button" onClick={async () => flash((await copy(url)) ? "Link copied" : "Couldn't copy. Press and hold the link.")} className="bg-ink px-4 font-black text-lime uppercase">
          Copy
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <a href={`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`} target="_blank" rel="noreferrer" className="btn btn-sm bg-ink text-bone">
          WhatsApp
        </a>
        <button
          type="button"
          className="btn btn-sm bg-ink text-bone"
          onClick={async () => {
            await copy(url);
            flash("Link copied. Add it as a link sticker on your story.");
            if (/iPhone|Android/i.test(navigator.userAgent)) window.location.href = "instagram://story-camera";
          }}
        >
          IG Story
        </button>
      </div>
      <p aria-live="polite" className={`mt-3 h-5 text-sm font-bold ${toast ? "" : "invisible"}`}>{toast ?? "·"}</p>
    </div>
  );
}
