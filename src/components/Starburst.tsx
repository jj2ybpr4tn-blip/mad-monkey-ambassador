// 16-point spiky starburst: the brand device that carries an offer.
const POINTS = Array.from({ length: 32 }, (_, i) => {
  const r = i % 2 ? 37 : 50;
  const a = (Math.PI * 2 * i) / 32 - Math.PI / 2;
  return `${(50 + r * Math.cos(a)).toFixed(1)}% ${(50 + r * Math.sin(a)).toFixed(1)}%`;
}).join(",");

export function Starburst({ children, size = 128, rotate = -8, bg = "bg-lime", className = "" }: { children: React.ReactNode; size?: number; rotate?: number; bg?: string; className?: string }) {
  return (
    <div
      className={`grid place-content-center ${bg} text-ink text-center font-black lowercase leading-none ${className}`}
      style={{ width: size, height: size, clipPath: `polygon(${POINTS})`, transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </div>
  );
}
