import QRCode from "qrcode";

/** A QR code as inline SVG, ink on bone. */
export async function QrCode({ value, size = 168, label }: { value: string; size?: number; label: string }) {
  const svg = await QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0a0a0a", light: "#f5efe2" } });
  return <div role="img" aria-label={label} style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />;
}
