// Deterministic pseudo-random, so the illustration is stable across renders.
function rand(seed: number) {
  const v = Math.sin(seed * 127.1) * 43758.5453;
  return v - Math.floor(v);
}

const COLORS = ["#1b2333", "#3d5fce", "#5b7ee8", "#e8a838"];

/**
 * Original illustration: scattered squares on the left resolve into a clean,
 * even grid on the right. Visual metaphor for "raw information becoming a
 * clear screen", not a copy of any reference site's artwork or copy.
 */
export function PixelFlow() {
  const cell = 14;
  const cols = 70;
  const rows = 10;
  const rects: { x: number; y: number; c: string }[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const progress = col / cols; // 0 = chaotic, 1 = ordered
      const seed = row * 91 + col * 17;
      if (rand(seed) > 0.55 - progress * 0.3) continue;

      const jitter = (1 - progress) * 10;
      const x =
        col * cell + (rand(seed + 1) - 0.5) * jitter * 2;
      const y =
        row * cell + (rand(seed + 2) - 0.5) * jitter * 2;
      const colorIdx = Math.floor(rand(seed + 3) * COLORS.length);
      rects.push({ x, y, c: COLORS[colorIdx] });
    }
  }

  const w = cols * cell;
  const h = rows * cell;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-auto"
      role="img"
      aria-label="Illustration of scattered squares resolving into an ordered grid, representing turning raw information into a clear screen"
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={cell - 3} height={cell - 3} fill={r.c} />
      ))}
    </svg>
  );
}
