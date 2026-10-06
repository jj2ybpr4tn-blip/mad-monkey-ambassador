/* eslint-disable @next/next/no-img-element */
// The official white wordmark for Mad Black canvases, loaded from the design
// system. Never redrawn or recoloured. Swap for a local copy in /public when built.
export function Logo({ width = 112 }: { width?: number }) {
  return (
    <img
      src="https://design.madmonkeyhostels.com/logo/mad-monkey-white.png"
      alt="Mad Monkey"
      width={width}
      style={{ width, height: "auto" }}
    />
  );
}
