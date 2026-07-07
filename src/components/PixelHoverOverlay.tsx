import type { CSSProperties } from "react";

function rand(seed: number) {
  const v = Math.sin(seed * 127.1) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * Pixel-mosaic hover overlay for work-card images.
 *
 * Two things this deliberately does NOT do, per feedback on the first pass:
 * - it does not cover the whole image. Tiles are confined to one small
 *   rectangular region per card (a corner or edge band, position varies by
 *   seed), so most of the photo stays untouched and only a fragment
 *   "dissolves" into pixels on hover.
 * - it does not use a shared generic palette. `colors` is that project's own
 *   sampled dominant colors (see accentColors in data/projects.ts), so the
 *   tiles always read as belonging to that specific image.
 */
export function PixelHoverOverlay({
  seed = 0,
  colors,
}: {
  seed?: number;
  colors: string[];
}) {
  const cols = 16;
  const rows = 10;

  // One rectangular region of the grid, sized/positioned per card so the
  // effect never touches the full image and varies project to project.
  const regionW = 0.35 + rand(seed * 13.1) * 0.25; // ~35-60% of width
  const regionH = 0.35 + rand(seed * 17.7) * 0.3; // ~35-65% of height
  const regionX = rand(seed * 23.3) > 0.5 ? 1 - regionW : 0;
  const regionY = rand(seed * 29.9) > 0.5 ? 1 - regionH : 0;

  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = c / cols;
      const v = r / rows;
      if (u < regionX || u >= regionX + regionW) continue;
      if (v < regionY || v >= regionY + regionH) continue;

      const i = r * cols + c;
      const s = seed * 971 + i * 37;
      if (rand(s) > 0.55) continue; // sparse even within the region

      tiles.push({
        i,
        left: u * 100,
        top: v * 100,
        color: colors[Math.floor(rand(s + 1) * colors.length)],
        o: 0.25 + rand(s + 2) * 0.45,
      });
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {tiles.map((t) => (
        <div
          key={t.i}
          className="pixel-tile absolute"
          style={
            {
              left: `${t.left}%`,
              top: `${t.top}%`,
              width: `${100 / cols}%`,
              height: `${100 / rows}%`,
              background: t.color,
              "--tile-i": t.i,
              "--tile-o": t.o,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
