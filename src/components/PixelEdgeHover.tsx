import { useEffect, useRef } from "react";

const COLS = 20;
const ROWS = 14;
const CARD_RATIO = 4 / 3; // must match the card's aspect class
const TICK_MS = 85; // discrete step = chunky mosaic motion
const WAVE_TICKS = 6; // sweep-in duration ≈ 0.5s

function hash(a: number, b: number, c: number) {
  let h =
    (Math.imul(a, 374761393) +
      Math.imul(b, 668265263) +
      Math.imul(c, 1440662683)) |
    0;
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295;
}

type Mode = "idle" | "in" | "hold" | "out";

/**
 * Animated mosaic hover, mechanic-faithful to craft.wild.as's work cards:
 *
 * - the cover is pre-sampled to a COLS x ROWS grid (same center-crop as CSS
 *   object-cover), so every mosaic block carries the image's own color at
 *   that spot — plus a coarse half-resolution sample for chunky 2x2 blocks
 * - on hover a mosaic wave sweeps in from the side the cursor entered,
 *   advancing in discrete ticks (~85ms), each cell flipping when the wave
 *   front passes its jittered threshold
 * - while hovered the mosaic never freezes: a diagonal band keeps drifting
 *   across the card and edge-biased patches flicker in and out
 * - on leave the wave reverses and clears
 * - this layer sits ON TOP of everything in the card (image and the
 *   centered CTA), so blocks visibly flash over the label, like the site
 * - touch devices and prefers-reduced-motion get nothing (plain hover)
 */
export function PixelEdgeHover({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
    if (reduceMotion || !finePointer) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const card = canvas.closest("a") ?? canvas.parentElement;
    if (!card) return;

    // fine color grid, sampled once per src
    let fine: string[] = [];
    let ready = false;

    let mode: Mode = "idle";
    let wave = 0; // 0..WAVE_TICKS
    let origin: 0 | 1 | 2 | 3 = 0; // left/right/top/bottom
    let holdT = 0;
    let raf = 0;
    let lastTick = -1;
    let width = 0;
    let height = 0;

    const img = new Image();
    img.decoding = "async";
    img.src = src;
    img.onload = () => {
      const off = document.createElement("canvas");
      off.width = COLS;
      off.height = ROWS;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
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
      octx.drawImage(img, sx, sy, sw, sh, 0, 0, COLS, ROWS);
      let data: Uint8ClampedArray;
      try {
        data = octx.getImageData(0, 0, COLS, ROWS).data;
      } catch {
        return; // cross-origin; skip the effect
      }
      fine = [];
      for (let i = 0; i < COLS * ROWS; i++) {
        fine.push(`rgb(${data[i * 4]}, ${data[i * 4 + 1]}, ${data[i * 4 + 2]})`);
      }
      ready = true;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    /** Wave-axis position of a cell, 0..1, measured from the entry side. */
    const axis = (c: number, r: number) => {
      if (origin === 0) return c / (COLS - 1);
      if (origin === 1) return 1 - c / (COLS - 1);
      if (origin === 2) return r / (ROWS - 1);
      return 1 - r / (ROWS - 1);
    };

    const draw = (tick: number) => {
      ctx.clearRect(0, 0, width, height);
      if (!ready) return;
      const cw = width / COLS;
      const ch = height / ROWS;
      const p = wave / WAVE_TICKS; // wave progress 0..1

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          // keep a clear radius at the image center so it stays readable
          const dx = (c - (COLS - 1) / 2) / (COLS / 2);
          const dy = (r - (ROWS - 1) / 2) / (ROWS / 2);
          if (dx * dx + dy * dy < 0.5) continue;
          // never cover the centered CTA label at the bottom
          if (r >= ROWS - 3 && c > COLS * 0.28 && c < COLS * 0.72) continue;

          const jitter = (hash(c, r, 991) - 0.5) * 0.35;
          const a = axis(c, r) + jitter;
          let on = false;

          if (mode === "in") {
            // band behind the front stays, cells right at the front flicker
            on = a < p - 0.12 || (a < p && hash(c, r, tick) > 0.35);
          } else if (mode === "out") {
            on = a > p + 0.12 || (a > p && hash(c, r, tick) > 0.35);
          } else if (mode === "hold") {
            // drifting diagonal band + edge-biased flicker
            const band = ((c / COLS + r / ROWS) / 2 + holdT * 0.06) % 1;
            const inBand = band < 0.16;
            const edge = Math.min(c, r, COLS - 1 - c, ROWS - 1 - r);
            const edgeP = edge === 0 ? 0.5 : edge === 1 ? 0.25 : 0.05;
            on =
              (inBand && hash(c, r, Math.floor(tick / 2)) > 0.45) ||
              hash(c, r, Math.floor(tick / 2) * 31) < edgeP * 0.5;
          }

          if (!on) continue;
          ctx.fillStyle = fine[r * COLS + c];
          ctx.fillRect(
            Math.floor(c * cw),
            Math.floor(r * ch),
            Math.ceil(cw),
            Math.ceil(ch)
          );
        }
      }
    };

    const loop = (now: number) => {
      const tick = Math.floor(now / TICK_MS);
      if (tick !== lastTick) {
        lastTick = tick;
        if (mode === "in") {
          wave = Math.min(WAVE_TICKS, wave + 1);
          if (wave >= WAVE_TICKS) {
            mode = "hold";
            holdT = 0;
          }
        } else if (mode === "hold") {
          holdT += 1;
        } else if (mode === "out") {
          wave = Math.max(0, wave - 1);
          if (wave <= 0) mode = "idle";
        }
        draw(tick);
      }
      if (mode !== "idle") {
        raf = requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };

    const onEnter = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      // pick the closest edge as the wave origin
      const d = [x, 1 - x, y, 1 - y];
      origin = d.indexOf(Math.min(...d)) as 0 | 1 | 2 | 3;
      mode = "in";
      wave = 0;
      start();
    };
    const onLeave = () => {
      if (mode === "idle") return;
      mode = "out";
      start();
    };

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
      aria-hidden="true"
    />
  );
}
