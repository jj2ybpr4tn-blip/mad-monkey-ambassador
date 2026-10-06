import QRCode from "qrcode";
import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin";

/** Print-ready QR code for a campus poster, pointing at the uni's giveaway page with its spot. */
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) return new Response("Not signed in", { status: 401 });
  const q = request.nextUrl.searchParams;
  const uni = (q.get("uni") ?? "").replace(/[^a-z0-9-]/g, "");
  const spot = (q.get("spot") ?? "").replace(/[^a-z0-9-]/g, "");
  const url = `${request.nextUrl.origin}/${uni}${spot ? `?src=${spot}` : ""}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "H", color: { dark: "#0a0a0a", light: "#ffffff" } });
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Content-Disposition": `attachment; filename="qr-${uni}${spot ? `-${spot}` : ""}.svg"` },
  });
}
