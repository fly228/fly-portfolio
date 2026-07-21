import { useEffect, useRef } from "react";
import { PORTRAIT_FACE, PORTRAIT_HELLO } from "./PortraitBitmap";

/**
 * Hero: fine 8px pixel grid (hero-only, see index.css) + cursor-reactive
 * heat canvas + the pixel self-portrait.
 *
 * The portrait is the hero's anchor image — the meaningful pixels replacing
 * plain random flicker. Design notes:
 *
 * 1. Sparks + ambient flicker fill the whole field but skip two things: the
 *    portrait's own ink, and the real text blocks (title, name, intro line,
 *    subtitle) — measured live via `[data-text-block]` so copy never gets
 *    covered. A little flicker right next to the text is fine; on top of it
 *    is not.
 * 2. Completeness + scale: the portrait is bottom-aligned, its resting
 *    bottom row flush with the hero's own bottom edge (齊下), sized to use
 *    nearly all the space below the measured text block, never cropped.
 * 3. HELLO is a separate, big, bold uppercase wordmark, placed independently
 *    to the right of the portrait.
 * 4. Breathing (procedural, no source frames): the WHOLE figure is one
 *    connected silhouette — no head/body split, so it can never break apart
 *    at the neck. A single breath phase drives a per-row vertical offset that
 *    eases smoothly from the top of the head (moves most) down to the
 *    shoulders (nearly anchored), so the neck flexes instead of tearing.
 *    Painted cells overlap their neighbour below by a few px, so per-row
 *    rounding can never open a seam. The motion is DOWN-only from rest
 *    (an exhale-and-return), so the bottom row is always at — or clipped to —
 *    the hero's bottom edge and never floats up. Occasional randomized blink
 *    and mouth-open beats ride the same offset.
 * 5. Cursor over the portrait or HELLO: ink lit by the cursor turns white
 *    instead of scattering, keeping the outline — the pointer "illuminates".
 *
 * Respects prefers-reduced-motion by rendering a single static frame.
 */
export function HeatHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const cell = 16;
    let cols = 0;
    let rows = 0;
    let heat: Float32Array = new Float32Array(0);
    let ink: Uint8Array = new Uint8Array(0); // heat cells covered by portrait/hello ink
    let textZone: Uint8Array = new Uint8Array(0); // heat cells covered by real copy
    let raf = 0;
    let t = 0;
    const mouse = { x: -9999, y: -9999 };

    const INK = "#1b2333";
    const ILLUM = 42; // px radius the cursor lights ink to white

    const P_ROWS = PORTRAIT_FACE.length;
    const P_COLS = PORTRAIT_FACE[0].length;
    const H_ROWS = PORTRAIT_HELLO.length;
    const H_COLS = PORTRAIT_HELLO[0].length;

    // Eye band + closed-lid line used for the blink beat (row/col indices
    // into PORTRAIT_FACE — spans both glasses lenses).
    const EYE_R0 = 18;
    const EYE_R1 = 23;
    const EYE_C0 = 8;
    const EYE_C1 = 33;
    const EYE_LID_ROW = 20;
    const LID_L: [number, number] = [11, 16];
    const LID_R: [number, number] = [23, 28];
    // Extra cells drawn just under the smile for the mouth-open beat (within
    // the head band, so they ride the head's bob).
    const MOUTH_EXTRA: Array<[number, number, number]> = [
      [33, 18, 21],
      [34, 19, 20],
    ];

    // The portrait is TWO sprites plus a connective neck, animated as real
    // frames — not one bitmap slid by a pushpin:
    //   HEAD  = rows 0..HEAD_END   (hair + face + glasses + chin/jaw)
    //   NECK  = rows HEAD_END+1..BODY_TOP-1  (stretchy connector, redrawn each
    //           frame to exactly bridge the moving chin and the collar)
    //   BODY  = rows BODY_TOP..end (collar + shoulders; chest squashes,
    //           bottom row stays planted)
    // The head bobs on its own cycle; the chest squashes on a different one;
    // the neck stretches/compresses to follow, so the two parts read as
    // independently breathing yet never tear apart and the chin never
    // collides with the collar.
    const HEAD_END = 33;
    const BODY_TOP = 38;
    const BODY_BOTTOM = P_ROWS - 1;

    // pCellX/pCellY: the portrait is allowed a mild horizontal stretch (the
    // hero is short and very wide, so height is always the tight
    // constraint — stretching the column pitch a little uses more of that
    // width for a visibly bigger figure without needing more vertical room).
    let pCellX = 0;
    let pCellY = 0;
    let pX = 0;
    let pY = 0;
    let headAmp = 0; // px the head bobs (± from rest)
    let bodyAmp = 0; // px the collar/chest lifts on inhale
    let helloCell = 0;
    let helloX = 0;
    let helloY = 0;
    let helloPad = 0;

    // Body chest-squash offset for a given body row: collar top (BODY_TOP)
    // lifts the full amount on inhale, easing to 0 at the planted bottom row.
    function bodyOffset(r: number, bodyPhase: number): number {
      const w = (BODY_BOTTOM - r) / (BODY_BOTTOM - BODY_TOP);
      return Math.round(-bodyPhase * bodyAmp * w);
    }

    // Blink / mouth-open beats: randomized, not a fixed loop.
    let nextBlinkAt = -1;
    let blinkEndAt = 0;
    let nextSmileAt = -1;
    let smileEndAt = 0;

    function stampInk(
      bitmap: string[],
      bRows: number,
      bCols: number,
      originX: number,
      originY: number,
      sizeX: number,
      sizeY: number
    ) {
      for (let r = 0; r < bRows; r++) {
        const row = bitmap[r];
        for (let c = 0; c < bCols; c++) {
          if (row[c] !== "X") continue;
          const gx = Math.floor((originX + c * sizeX + sizeX / 2) / cell);
          const gy = Math.floor((originY + r * sizeY + sizeY / 2) / cell);
          if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) ink[gy * cols + gx] = 1;
        }
      }
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(rect.width / cell);
      rows = Math.ceil(rect.height / cell);
      heat = new Float32Array(cols * rows);

      // Measure the real text blocks so sparks + ink never sit under copy;
      // their union bottom also defines where the portrait's band starts.
      textZone = new Uint8Array(cols * rows);
      let textBottom = 0;
      const section = canvas!.closest("section");
      if (section) {
        section
          .querySelectorAll<HTMLElement>("[data-text-block]")
          .forEach((el) => {
            const r = el.getBoundingClientRect();
            const x0 = Math.max(0, Math.floor((r.left - rect.left) / cell));
            const x1 = Math.min(
              cols - 1,
              Math.ceil((r.right - rect.left) / cell)
            );
            const y0 = Math.max(0, Math.floor((r.top - rect.top) / cell));
            const y1 = Math.min(
              rows - 1,
              Math.ceil((r.bottom - rect.top) / cell)
            );
            for (let gy = y0; gy <= y1; gy++) {
              for (let gx = x0; gx <= x1; gx++) {
                textZone[gy * cols + gx] = 1;
              }
            }
            textBottom = Math.max(textBottom, r.bottom - rect.top);
          });
      }

      const topBand = Math.min(
        Math.max(textBottom + 14, 100),
        rect.height * 0.58
      );

      // Portrait: fit fully, bottom-aligned flush with the hero's own
      // bottom edge. Height is always the binding constraint (short, wide
      // hero), so let the column pitch stretch up to ~22% wider than the
      // row pitch — a visibly bigger figure, still close enough to square
      // pixels that the glasses/face don't read as distorted.
      // Bigger + left-biased, matching 對應關係.png: the portrait sits toward
      // the left, the wordmark fills the right. Height is the binding
      // constraint; let the column pitch stretch ~30% wider for a larger
      // figure that still reads as pixel-square.
      const availH = rect.height - topBand;
      pCellY = Math.max(2, Math.floor(availH / P_ROWS));
      pCellX = Math.max(2, Math.round(pCellY * 1.3));
      pX = Math.round(rect.width * 0.05); // hug the left edge
      // Resting bottom row flush with the hero's bottom edge; the body's
      // planted bottom stays here and the chest breathes upward from it.
      pY = Math.floor(rect.height - P_ROWS * pCellY);
      headAmp = Math.max(3, Math.round(pCellY * 0.34));
      bodyAmp = Math.max(3, Math.round(pCellY * 0.5));

      // HELLO: even bigger and bold, filling the empty right side, vertically
      // centred on the portrait's face. Sized off the viewport, then clamped
      // to the right-hand margin so it never overlaps the portrait.
      const portraitRight = pX + P_COLS * pCellX;
      const helloEdgeMargin = Math.max(28, rect.width * 0.035);
      const helloGap = 44; // clearance between portrait and the wordmark
      const helloMaxByMargin =
        (rect.width - portraitRight - helloGap - helloEdgeMargin) / H_COLS;
      const helloTargetCell = Math.max(pCellY * 3.1, rect.width * 0.02);
      const helloMaxByHeight = ((rect.height - topBand) * 0.5) / H_ROWS;
      helloCell = Math.max(
        6,
        Math.min(helloTargetCell, helloMaxByMargin, helloMaxByHeight, 58)
      );
      helloPad = Math.max(0.5, helloCell * 0.07); // subtle extra weight
      const helloW = H_COLS * helloCell;
      const helloH = H_ROWS * helloCell;
      helloX = Math.floor(rect.width - helloW - helloEdgeMargin);
      // centre on the portrait's face band (roughly its upper-middle)
      const faceMidY = pY + P_ROWS * pCellY * 0.4;
      helloY = Math.floor(faceMidY - helloH / 2);

      // Rasterize both bitmaps' ink onto the heat grid so sparks skip them.
      ink = new Uint8Array(cols * rows);
      stampInk(PORTRAIT_FACE, P_ROWS, P_COLS, pX, pY, pCellX, pCellY);
      stampInk(PORTRAIT_HELLO, H_ROWS, H_COLS, helloX, helloY, helloCell, helloCell);
    }

    function paintCell(x: number, y: number, w: number, h: number, pad = 0) {
      let color = INK;
      if (mouse.x > -500) {
        const dx = x + w / 2 - mouse.x;
        const dy = y + h / 2 - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < ILLUM) {
          const k = 1 - d / ILLUM;
          const ch = Math.round(27 + (255 - 27) * k);
          const cg = Math.round(35 + (255 - 35) * k);
          const cb = Math.round(51 + (255 - 51) * k);
          color = `rgb(${ch}, ${cg}, ${cb})`;
        }
      }
      ctx!.fillStyle = color;
      if (pad) ctx!.fillRect(x - pad, y - pad, w + pad * 2, h + pad * 2);
      else ctx!.fillRect(x, y, w, h);
    }

    /**
     * Draw the portrait as three animated bands. `headDy` is the head's bob
     * (whole px), `bodyPhase` is the chest-squash phase (-1..1). The neck is
     * redrawn each frame to bridge the moving chin and the (also moving)
     * collar, so the head and body breathe independently without ever
     * tearing apart or letting the chin land on the collar.
     */
    function drawPortrait(
      headDy: number,
      bodyPhase: number,
      blinking: boolean,
      mouthOpen: boolean
    ) {
      const hDraw = pCellY + 2; // 2px vertical overlap hides rounding seams

      // --- BODY (collar + shoulders): chest squashes up, bottom planted ---
      for (let r = BODY_TOP; r < P_ROWS; r++) {
        const row = PORTRAIT_FACE[r];
        const y = pY + r * pCellY + bodyOffset(r, bodyPhase);
        for (let c = 0; c < P_COLS; c++) {
          if (row[c] === "X") paintCell(pX + c * pCellX, y, pCellX, hDraw);
        }
      }

      // --- NECK: remap rows HEAD_END+1..BODY_TOP-1 into the live gap between
      // the chin bottom (moves with the head) and the collar top (moves with
      // the chest), so the neck stretches / compresses to stay connected. ---
      const chinBottomY = pY + (HEAD_END + 1) * pCellY + headDy;
      const collarTopY = pY + BODY_TOP * pCellY + bodyOffset(BODY_TOP, bodyPhase);
      const natTop = pY + (HEAD_END + 1) * pCellY;
      const natBottom = pY + BODY_TOP * pCellY;
      for (let r = HEAD_END + 1; r < BODY_TOP; r++) {
        const row = PORTRAIT_FACE[r];
        const yNat = pY + r * pCellY;
        const frac = (yNat - natTop) / (natBottom - natTop);
        const y = chinBottomY + frac * (collarTopY - chinBottomY);
        for (let c = 0; c < P_COLS; c++) {
          if (row[c] === "X") paintCell(pX + c * pCellX, y, pCellX, hDraw);
        }
      }

      // --- HEAD (hair + face + chin): bobs as one rigid sprite, on top ---
      for (let r = 0; r <= HEAD_END; r++) {
        const row = PORTRAIT_FACE[r];
        const y = pY + r * pCellY + headDy;
        const inEyeRow = blinking && r >= EYE_R0 && r <= EYE_R1;
        for (let c = 0; c < P_COLS; c++) {
          if (row[c] !== "X") continue;
          if (inEyeRow && c >= EYE_C0 && c <= EYE_C1) continue;
          paintCell(pX + c * pCellX, y, pCellX, hDraw);
        }
      }
      if (blinking) {
        const y = pY + EYE_LID_ROW * pCellY + headDy;
        for (let c = LID_L[0]; c <= LID_L[1]; c++)
          paintCell(pX + c * pCellX, y, pCellX, hDraw);
        for (let c = LID_R[0]; c <= LID_R[1]; c++)
          paintCell(pX + c * pCellX, y, pCellX, hDraw);
      }
      if (mouthOpen) {
        for (const [r, c0, c1] of MOUTH_EXTRA) {
          const y = pY + r * pCellY + headDy;
          for (let c = c0; c <= c1; c++)
            paintCell(pX + c * pCellX, y, pCellX, hDraw);
        }
      }
    }

    function drawHello() {
      for (let r = 0; r < H_ROWS; r++) {
        const row = PORTRAIT_HELLO[r];
        for (let c = 0; c < H_COLS; c++) {
          if (row[c] !== "X") continue;
          paintCell(
            helloX + c * helloCell,
            helloY + r * helloCell,
            helloCell,
            helloCell,
            helloPad
          );
        }
      }
    }

    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    function colorFor(v: number): string | null {
      if (v < 0.06) return null;
      if (v < 0.18) return "#1b2333";
      if (v < 0.34) return "#3d5fce";
      if (v < 0.52) return "#5b7ee8";
      if (v < 0.68) return "#e8a838";
      if (v < 0.86) return "#d8462f";
      return "#f4e94a";
    }

    function drawStatic() {
      const rect = canvas!.getBoundingClientRect();
      ctx!.clearRect(0, 0, rect.width, rect.height);
      ctx!.fillStyle = "#1b2333";
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const i = cy * cols + cx;
          if ((cx + cy) % 11 === 0 && !ink[i] && !textZone[i]) {
            ctx!.fillRect(cx * cell + 1, cy * cell + 1, cell - 2, cell - 2);
          }
        }
      }
      drawPortrait(0, 0, false, false);
      drawHello();
    }

    function hash(x: number, y: number): number {
      const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return v - Math.floor(v);
    }

    function step(now: number) {
      t += 1;
      if (nextBlinkAt < 0) nextBlinkAt = now + 1600 + Math.random() * 2200;
      if (nextSmileAt < 0) nextSmileAt = now + 3200 + Math.random() * 3200;

      if (now > nextBlinkAt && now > blinkEndAt) {
        blinkEndAt = now + 140;
        nextBlinkAt = now + 140 + 2800 + Math.random() * 3400;
      }
      const blinking = now < blinkEndAt;

      if (now > nextSmileAt && now > smileEndAt) {
        smileEndAt = now + 650;
        nextSmileAt = now + 650 + 4200 + Math.random() * 4000;
      }
      const mouthOpen = now < smileEndAt;

      // Two independent breathing cycles, quantised to whole px so the sprite
      // steps like real frames (not a smooth pushpin slide): the head bobs on
      // one period, the chest squashes on a slower, offset one. The neck
      // bridges whatever gap results, so they stay connected.
      const headDy = Math.round(Math.sin(now * 0.0019) * headAmp);
      const bodyPhase = Math.sin(now * 0.0013 + 1.1);

      const mcx = Math.floor(mouse.x / cell);
      const mcy = Math.floor(mouse.y / cell);
      const radius = 3;
      const noiseFrame = Math.floor(t / 50);

      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const i = cy * cols + cx;
          heat[i] *= 0.93;

          const n = hash(cx, cy * 7.13 + noiseFrame * 0.61);
          if (n > 0.988) heat[i] = Math.max(heat[i], 0.2 + n * 0.05);

          if (mouse.x > -500) {
            const dx = cx - mcx;
            const dy = cy - mcy;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < radius) {
              const boost = 1 - d / radius;
              heat[i] = Math.min(1, heat[i] + boost * boost * 0.55);
            }
          }
        }
      }

      const rect = canvas!.getBoundingClientRect();
      ctx!.clearRect(0, 0, rect.width, rect.height);
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          // heat + sparks fill the whole field, only skipping portrait/hello
          // ink and the real text blocks, so the flicker blends around and
          // through the empty space without ever sitting on copy.
          const i = cy * cols + cx;
          if (ink[i] || textZone[i]) continue;
          const v = heat[i];
          const c = colorFor(v);
          if (!c) continue;
          ctx!.fillStyle = c;
          ctx!.fillRect(cx * cell + 1, cy * cell + 1, cell - 2, cell - 2);
        }
      }
      drawPortrait(headDy, bodyPhase, blinking, mouthOpen);
      drawHello();
      raf = requestAnimationFrame(step);
    }

    resize();
    window.addEventListener("resize", resize);

    if (reduceMotion) {
      drawStatic();
    } else {
      canvas.addEventListener("mousemove", onMove);
      canvas.addEventListener("mouseleave", onLeave);
      raf = requestAnimationFrame(step);
    }

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative w-full min-h-[100dvh] text-ink overflow-hidden">
      {/* Fine 8px grid, confined to the hero. Other sections stay clean. */}
      <div className="hero-grid absolute inset-0" aria-hidden="true" />

      {/* Full-hero canvas sits behind the text; portrait + sparks share it. */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />

      <div className="relative z-10 px-6 md:px-12 pt-6 pointer-events-none">
        <p data-text-block className="text-sm font-medium tracking-wide">
          Fly Weng
        </p>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 px-6 md:px-12 pt-16 md:pt-24 pb-4 pointer-events-none">
        <h1
          data-text-block
          className="text-4xl sm:text-5xl md:text-7xl tracking-normal leading-tight font-semibold"
        >
          把複雜的事，
          <br />
          講到一眼看懂。
        </h1>
        <div data-text-block className="max-w-xs md:text-right md:pb-2">
          <p className="text-sm text-ink/70 leading-relaxed">
            UI、簡報與動態影像設計。十多年替科技與公部門專案，把難講的內容變成看得懂的畫面。
          </p>
        </div>
      </div>
    </section>
  );
}
