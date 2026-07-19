import { useEffect, useRef } from "react";

/**
 * Pixel-flow illustration: chaos → order → rotating DNA double helix,
 * with a cursor-repulsion field AND a hero-style heat ball layered on top.
 *
 * Mechanics (studied from grid-quantised pixel animations, re-implemented
 * from observation):
 * - everything snaps to a fixed square grid over faint graph paper
 * - the ART updates in discrete ticks, so the pattern itself is chunky,
 *   not smooth (matches the site's stepwise pixel-art motion)
 * - the CURSOR REPULSION runs every animation frame, decoupled from the
 *   art's tick clock: every cell has a "home" grid slot and a persistent
 *   spring-eased displacement toward/away from that slot. Cells inside a
 *   radius around the pointer get pushed straight out along the line from
 *   the pointer, strongest at the centre and fading to zero at the edge —
 *   this is what carves the round, ball-shaped gap in the pattern and lets
 *   it close smoothly again once the pointer moves away, rather than
 *   snapping back instantly.
 * - a HEAT BALL fills that cleared void: same colour-band function as the
 *   hero's cursor heat effect (navy → blue → light blue → amber → red →
 *   yellow at the very centre), computed straight from distance-to-cursor
 *   each frame, with a jittered edge so the rings aren't perfect circles.
 * - strand paths = helix + smooth value-noise drift → shapes morph slowly
 * - per-cell stochastic dropout + shade shuffle every other tick → shimmer
 * - many shades per hue; strands are 1–3 cells thick with dithered edges;
 *   chunky pools of cells collect at the curve extremes
 * - left: full-height scattered blue chaos; middle: tight braid waist;
 *   right: yellow double helix, continuously rotating, blue flecks mixed in
 */

const BLUES = ["#1b2333", "#2f49a8", "#3d5fce", "#5b7ee8", "#93a7ee", "#c9d2f4"];
const YELLOWS = ["#d18f1f", "#e8a838", "#f2c568", "#f7dc9b", "#fbeecb"];
const GRID_LINE = "rgba(27, 35, 51, 0.045)";

const CELL = 12; // logical px per grid cell
const GAP = 2;
const ROWS = 26;
const TICK_MS = 95; // discrete step = pixel-art motion for the pattern itself

const ROTATION_TICKS = 64; // helix full turn ≈ 6s

// ---- cursor repulsion tuning -----------------------------------------------
const REPEL_RADIUS = 130; // px, how far the push reaches — a bigger void
const REPEL_STRENGTH = 85; // px, max push at the very centre, scaled to match
const REPEL_EASE = 0.22; // per-frame spring toward the target displacement

// ---- cursor heat-ball tuning (same band colours as the hero) --------------
const HEAT_RADIUS = 34; // px, a small ball sitting inside the bigger void

// ---- ghost trail (observed on the reference site) --------------------------
// When the cursor leaves a spot, the ball's footprint stays behind as dark
// navy cells that dissolve over a few seconds.
const GHOST_DECAY = 0.965; // per animation frame → fades over ~2-4s
const GHOST_SEED = 0.85; // strength stamped under the ball each frame
function heatColorFor(v: number): string | null {
  if (v < 0.06) return null;
  if (v < 0.18) return "#1b2333";
  if (v < 0.34) return "#3d5fce";
  if (v < 0.52) return "#5b7ee8";
  if (v < 0.68) return "#e8a838";
  if (v < 0.86) return "#d8462f";
  return "#f4e94a";
}

// ---- deterministic hash / noise -------------------------------------------

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

/** Smooth 1D value noise over (x, t), two octaves, range -1…1. */
function noise(x: number, t: number, seed: number) {
  let out = 0;
  let ampSum = 0;
  for (let oct = 0; oct < 2; oct++) {
    const f = oct === 0 ? 1 : 2.7;
    const amp = oct === 0 ? 1 : 0.45;
    const xf = x * f;
    const tf = t * f * 0.6;
    const x0 = Math.floor(xf);
    const t0 = Math.floor(tf);
    const fx = xf - x0;
    const ft = tf - t0;
    const sx = fx * fx * (3 - 2 * fx);
    const st = ft * ft * (3 - 2 * ft);
    const v =
      (hash(x0, t0, seed) * (1 - sx) + hash(x0 + 1, t0, seed) * sx) * (1 - st) +
      (hash(x0, t0 + 1, seed) * (1 - sx) + hash(x0 + 1, t0 + 1, seed) * sx) * st;
    out += (v - 0.5) * 2 * amp;
    ampSum += amp;
  }
  return out / ampSum;
}

const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const pick = (pal: string[], r: number, bias: number) =>
  pal[Math.min(pal.length - 1, Math.floor(Math.pow(r, bias) * pal.length))];

type Cell = { col: number; row: number; color: string; alpha: number };

// ---------------------------------------------------------------------------

export function PixelFlow() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cols = 0;
    let width = 0;
    const height = ROWS * CELL;
    let raf = 0;
    let running = true;
    let lastTick = -1;

    // Persistent per-grid-slot displacement, eased every animation frame.
    let dispX = new Float32Array(0);
    let dispY = new Float32Array(0);
    // Ghost trail: dark residue the ball leaves behind, fading per frame.
    let ghost = new Float32Array(0);
    let cachedCells: Cell[] = [];

    const mouse = { x: -9999, y: -9999, active: false };

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const resize = () => {
      const parentWidth = canvas.parentElement?.clientWidth ?? 900;
      cols = Math.max(48, Math.floor(parentWidth / CELL));
      width = cols * CELL;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastTick = -1;
      dispX = new Float32Array(cols * ROWS);
      dispY = new Float32Array(cols * ROWS);
      ghost = new Float32Array(cols * ROWS);
    };

    /** Queue a cell for this tick's pattern (bounds-checked, like a paint call). */
    const plan = (col: number, row: number, color: string, alpha = 1) => {
      if (row < 0 || row >= ROWS || col < 0 || col >= cols) return;
      cachedCells.push({ col, row, color, alpha });
    };

    /** Blue→yellow across u with a dithered boundary; rare contrast flips. */
    const shade = (u: number, r: number, r2: number) => {
      const y = ss(0.4, 0.6, u + (r - 0.5) * 0.18);
      const flip = r2 > 0.94;
      const useYellow = flip ? y < 0.5 : y >= 0.5;
      return pick(useYellow ? YELLOWS : BLUES, r2, 1.25);
    };

    // ---- build the art pattern for one tick (chunky, stepwise) ------------
    const buildPattern = (tick: number) => {
      cachedCells = [];

      const mid = (ROWS - 1) / 2;
      // Negative sign: makes the wave crawl left → right as time advances
      // (positive would crawl right → left).
      const phase = -(tick / ROTATION_TICKS) * Math.PI * 2;
      const slowT = tick * 0.02; // strand drift clock
      const fT = Math.floor(tick / 2); // cells re-roll every 2 ticks

      for (let col = 0; col < cols; col++) {
        const u = col / (cols - 1);

        // ---- zone shaping ----------------------------------------------
        const scatter = 1 - ss(0.3, 0.52, u);
        const amp =
          4.5 * ss(0.12, 0.3, u) * (1 - ss(0.38, 0.5, u)) + // blue lenses
          1.2 + // waist minimum
          9.5 * ss(0.52, 0.72, u) + // yellow helix
          9 * ss(0.8, 1.0, u); // opens wide at the end
        const wander = 4.5 * (1 - ss(0.35, 0.65, u));
        const presence = 0.12 + 0.85 * ss(0.3, 0.48, u);

        // ---- scattered chaos (left), full height, clumpy ----------------
        const nScatter = Math.round(scatter * 6);
        for (let i = 0; i < nScatter; i++) {
          const life = Math.floor((tick + i * 3) / 5); // persists ~5 ticks
          const r1 = hash(col * 13 + i, life, 11);
          if (r1 > 0.22 + scatter * 0.5) continue;
          const row = Math.floor(hash(col * 7 + i * 29, life, 23) * ROWS);
          const rs = hash(col + row * 31, life, 37);
          const c =
            rs > 0.96
              ? YELLOWS[1]
              : pick(BLUES, hash(col * 3, row + life, 41), 0.8);
          plan(col, row, c, 0.45 + rs * 0.55);
          if (hash(col, row + life, 43) > 0.55) {
            plan(
              col + (Math.floor(rs * 7) % 2),
              row + 1,
              pick(BLUES, hash(col, row * 5 + life, 47), 0.9),
              0.4 + rs * 0.4
            );
          }
        }

        // ---- twin strands ------------------------------------------------
        const t = u * Math.PI * 2 * (2.2 + 1.3 * u) + phase;
        const drift = noise(u * 6, slowT, 5) * wander;
        const drift2 = noise(u * 6, slowT, 9) * wander;

        for (const s of [0, 1] as const) {
          const a = t + s * Math.PI;
          const yF = mid + Math.sin(a) * amp + (s === 0 ? drift : drift2);
          const z = Math.cos(a);
          const row = Math.round(yF);

          // dithered thickness: core + neighbours
          for (let dy = -1; dy <= 1; dy++) {
            const rr = hash(col, row + dy, fT * 61 + s);
            const p = dy === 0 ? presence : presence * 0.38;
            if (rr > p) continue;
            const rShade = hash(col * 3 + dy, row, fT * 31 + s);
            const rMix = hash(col, row + dy * 5, fT * 17 + s);
            const depthFade = 0.65 + 0.35 * (z * 0.5 + 0.5);
            plan(
              col,
              row + dy,
              shade(u, rMix, rShade * (dy === 0 ? 0.6 : 1)),
              (dy === 0 ? 0.95 : 0.55) * (u > 0.5 ? depthFade : 1)
            );
          }

          // chunky pools at curve extremes (lens tops and bottoms)
          const nearExtreme = Math.abs(Math.cos(a)) < 0.35;
          if (nearExtreme && u > 0.5) {
            const pool = hash(col, s + 2, fT * 43);
            if (pool < 0.65) {
              const dir = Math.sin(a) > 0 ? 1 : -1;
              for (let k = 0; k <= 2; k++) {
                for (let dx = -1; dx <= 0; dx++) {
                  const rr = hash(col + dx * 17 + k, row, fT * 53 + s);
                  if (rr > 0.6 - k * 0.15) continue;
                  plan(
                    col + dx,
                    row + dir * k,
                    pick(YELLOWS, Math.min(1, rr * 1.6), 1.1),
                    0.75 - k * 0.18
                  );
                }
              }
            }
          }
        }

        // ---- stray sparkles ----------------------------------------------
        const spark = hash(col, fT, 71);
        if (spark > 0.95) {
          const row = Math.floor(hash(col, fT, 73) * ROWS);
          plan(col, row, shade(u, spark, 0.7), 0.3);
        }
      }
    };

    // ---- cursor repulsion physics, eased every animation frame -------------
    const updatePhysics = () => {
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          let tx = 0;
          let ty = 0;
          if (mouse.active) {
            const homeX = col * CELL + CELL / 2;
            const homeY = row * CELL + CELL / 2;
            const dx = homeX - mouse.x;
            const dy = homeY - mouse.y;
            const dist = Math.hypot(dx, dy) || 0.0001;
            if (dist < REPEL_RADIUS) {
              const falloff = 1 - dist / REPEL_RADIUS;
              const push = falloff * falloff * REPEL_STRENGTH;
              tx = (dx / dist) * push;
              ty = (dy / dist) * push;
            }
          }
          dispX[idx] += (tx - dispX[idx]) * REPEL_EASE;
          dispY[idx] += (ty - dispY[idx]) * REPEL_EASE;
        }
      }
      // fade the ghost trail
      for (let i = 0; i < ghost.length; i++) {
        if (ghost[i] > 0.002) ghost[i] *= GHOST_DECAY;
      }
    };

    // ---- render current cached pattern with current displacement ----------
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // faint graph-paper grid
      ctx.strokeStyle = GRID_LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        ctx.moveTo(c * CELL + 0.5, 0);
        ctx.lineTo(c * CELL + 0.5, height);
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.moveTo(0, r * CELL + 0.5);
        ctx.lineTo(width, r * CELL + 0.5);
      }
      ctx.stroke();

      for (const cell of cachedCells) {
        const idx = cell.row * cols + cell.col;
        const ox = dispX[idx] ?? 0;
        const oy = dispY[idx] ?? 0;
        ctx.globalAlpha = cell.alpha;
        ctx.fillStyle = cell.color;
        ctx.fillRect(
          cell.col * CELL + ox + 1,
          cell.row * CELL + oy + 1,
          CELL - GAP,
          CELL - GAP
        );
      }
      ctx.globalAlpha = 1;

      // ghost trail: dark navy residue where the ball has been, fading out
      // (drawn at home slots — the residue is "burned into" the grid)
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < cols; col++) {
          const g = ghost[row * cols + col];
          if (g < 0.08) continue;
          ctx.globalAlpha = Math.min(0.92, g);
          ctx.fillStyle = "#1b2333";
          ctx.fillRect(col * CELL + 1, row * CELL + 1, CELL - GAP, CELL - GAP);
        }
      }
      ctx.globalAlpha = 1;

      if (mouse.active) {
        // heat ball at the pointer, filling the void the repulsion just
        // cleared — same colour bands as the hero, drawn at each cell's
        // home slot (not displaced), with a jittered edge between bands.
        // While it sits somewhere it also stamps the ghost buffer, so a
        // dark residue stays behind once the cursor moves on.
        const minCol = Math.max(0, Math.floor((mouse.x - HEAT_RADIUS) / CELL));
        const maxCol = Math.min(
          cols - 1,
          Math.ceil((mouse.x + HEAT_RADIUS) / CELL)
        );
        const minRow = Math.max(0, Math.floor((mouse.y - HEAT_RADIUS) / CELL));
        const maxRow = Math.min(
          ROWS - 1,
          Math.ceil((mouse.y + HEAT_RADIUS) / CELL)
        );
        for (let row = minRow; row <= maxRow; row++) {
          for (let col = minCol; col <= maxCol; col++) {
            const homeX = col * CELL + CELL / 2;
            const homeY = row * CELL + CELL / 2;
            const dist = Math.hypot(homeX - mouse.x, homeY - mouse.y);
            const jitter = (hash(col, row, lastTick) - 0.5) * 0.3;
            const v = 1 - dist / HEAT_RADIUS + jitter;
            const c = heatColorFor(v);
            if (!c) continue;
            if (v > 0.3) {
              const idx = row * cols + col;
              ghost[idx] = Math.max(ghost[idx], GHOST_SEED);
            }
            ctx.fillStyle = c;
            ctx.fillRect(col * CELL + 1, row * CELL + 1, CELL - GAP, CELL - GAP);
          }
        }
      }
    };

    const loop = (now: number) => {
      if (!running) return;
      const tick = Math.floor(now / TICK_MS);
      if (tick !== lastTick) {
        lastTick = tick;
        buildPattern(tick);
      }
      updatePhysics();
      render();
      raf = requestAnimationFrame(loop);
    };

    const toCanvasPoint = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const onMove = (e: MouseEvent) => {
      const p = toCanvasPoint(e.clientX, e.clientY);
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const p = toCanvasPoint(touch.clientX, touch.clientY);
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.active = true;
    };
    const onTouchEnd = () => {
      mouse.active = false;
    };

    resize();
    if (reduceMotion) {
      buildPattern(0);
      updatePhysics();
      render();
    } else {
      canvas.addEventListener("mousemove", onMove);
      canvas.addEventListener("mouseleave", onLeave);
      canvas.addEventListener("touchmove", onTouchMove, { passive: true });
      canvas.addEventListener("touchend", onTouchEnd);
      canvas.addEventListener("touchcancel", onTouchEnd);
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduceMotion) {
        buildPattern(0);
        updatePhysics();
        render();
      }
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const io = new IntersectionObserver(([entry]) => {
      if (reduceMotion) return;
      if (entry.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(loop);
      } else if (!entry.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block"
      role="img"
      aria-label="像素動畫:左側散亂的藍色方格逐漸收攏,向右匯聚成持續旋轉的黃色 DNA 雙螺旋,滑鼠靠近時方格會被推開讓出一個圓形空間"
    />
  );
}
