import { NextResponse, type NextRequest } from "next/server";

const REF = /^[A-HJ-NP-Z2-9]{6}$/;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/**
 * Referral attribution. A visitor arriving on /exeter?r=K7F2QX keeps that code
 * for 30 days. First touch wins: an existing code is never overwritten.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const ref = request.nextUrl.searchParams.get("r")?.toUpperCase();
  if (ref && REF.test(ref) && !request.cookies.get("mm_ref")) {
    response.cookies.set("mm_ref", ref, { maxAge: THIRTY_DAYS, sameSite: "lax", path: "/" });
  }
  // Which QR poster or story they came from (?src=library). First touch wins.
  const src = request.nextUrl.searchParams.get("src");
  if (src && /^[\w-]{1,40}$/.test(src) && !request.cookies.get("mm_src")) {
    response.cookies.set("mm_src", src.toLowerCase(), { maxAge: THIRTY_DAYS, sameSite: "lax", path: "/" });
  }
  // A private link (?t=) from an email remembers who you are on this device.
  const token = request.nextUrl.searchParams.get("t");
  if (token && /^[\w-]{16,40}$/.test(token)) {
    response.cookies.set("mm_me", token, { maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true, path: "/" });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next|admin|favicon.ico).*)"],
};
