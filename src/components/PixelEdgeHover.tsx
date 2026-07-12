import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

interface Tile {
  key: number;
  left: number;
  top: number;
  color: string;
  delay: number;
}

const COLS = 20;
const ROWS = 14;
const BAND = 3; // edge band width in cells; the center never gets tiles
const CARD_RATIO = 4 / 3; // must match the card's aspect class

function rand(seed: number) {
  const v = Math.sin(seed * 127.1) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * Edge pixel-dissolve hover, mechanic-faithful to craft.wild.as:
 *
 * 1. The cover image is drawn onto an offscreen canvas at exactly COLS x ROWS
 *    resolution (with the same center-crop as CSS object-cover), so each
 *    canvas pixel IS the average color of that tile's real position in the
 *    image. Tile colors are read back with getImageData, never from a
 *    predefined palette.
 * 2. Tiles exist only in the outer edge band; the image center stays clean.
 * 3. Reveal timing is stepped and scattered (CSS steps() + per-tile delay).
 */
export function PixelEdgeHover({ src }: { src: string }) {
  const [tiles, setTiles] = useState<Tile[]>([]);

  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    img.onload = () => {
      if (!alive) return;
      const canvas = document.createElement("canvas");
      canvas.width = COLS;
      canvas.height = ROWS;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Replicate object-cover's center crop before sampling.
      const imgRatio = img.naturalWidth / img.naturalHeight;
      let sx = 0;
      let sy = 0;
      let sw = img.naturalWidth;
      let sh = img.naturalHeight;
      if (imgRatio > CARD_RATIO) {
        sw = img.naturalHeight * CARD_RATIO;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / CARD_RATIO;
        sy = (img.naturalHeight - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, COLS, ROWS);

      let data: Uint8ClampedArray;
      try {
        data = ctx.getImageData(0, 0, COLS, ROWS).data;
      } catch {
        return; // cross-origin image; skip the effect rather than fake colors
      }

      const next: Tile[] = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const edge = Math.min(c, r, COLS - 1 - c, ROWS - 1 - r);
          if (edge >= BAND) continue;
          // Denser at the very edge, sparser toward the inside of the band.
          const keep = edge === 0 ? 0.9 : edge === 1 ? 0.55 : 0.28;
          const s = r * 131 + c * 17;
          if (rand(s) > keep) continue;

          const i = (r * COLS + c) * 4;
          next.push({
            key: r * COLS + c,
            left: (c / COLS) * 100,
            top: (r / ROWS) * 100,
            color: `rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`,
            delay: Math.floor(rand(s + 7) * 220),
          });
        }
      }
      setTiles(next);
    };
    return () => {
      alive = false;
    };
  }, [src]);

  if (tiles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {tiles.map((t) => (
        <div
          key={t.key}
          className="pixel-tile absolute"
          style={
            {
              left: `${t.left}%`,
              top: `${t.top}%`,
              // +0.15% overdraw hides sub-pixel seams between tiles.
              width: `${100 / COLS + 0.15}%`,
              height: `${100 / ROWS + 0.15}%`,
              background: t.color,
              "--tile-d": t.delay,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
