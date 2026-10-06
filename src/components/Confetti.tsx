// A one-off burst of flat brand-colour confetti. Pure CSS, server-rendered.
const COLOURS = ["#ccff01", "#ff01aa", "#00fef3", "#ffc000", "#ff6600"];

export function Confetti() {
  const pieces = Array.from({ length: 36 }, (_, i) => ({
    left: (i * 37) % 100,
    delay: ((i * 13) % 10) / 12,
    colour: COLOURS[i % COLOURS.length],
    spin: (i * 47) % 360,
    w: 6 + (i % 3) * 3,
  }));
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0 overflow-visible">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti absolute top-0 block"
          style={{ left: `${p.left}%`, width: p.w, height: p.w * 1.6, background: p.colour, animationDelay: `${p.delay}s`, rotate: `${p.spin}deg` }}
        />
      ))}
    </div>
  );
}
