import { useEffect, useRef } from "react";
import { PORTRAIT_FACE } from "./PortraitBitmap";

// Column ranges of each letter in a wordmark bitmap, derived from the
// bitmap itself (contiguous columns that contain any ink, separated by
// all-blank gap columns) so the letter-mosaic animation below never needs
// hand-picked indices.
function computeLetterRanges(bitmap: string[]): Array<[number, number]> {
  const width = bitmap[0].length;
  const hasInk = new Array(width).fill(false);
  for (let c = 0; c < width; c++) {
    for (let r = 0; r < bitmap.length; r++) {
      if (bitmap[r][c] === "X") {
        hasInk[c] = true;
        break;
      }
    }
  }
  const ranges: Array<[number, number]> = [];
  let start = -1;
  for (let c = 0; c < width; c++) {
    if (hasInk[c] && start < 0) start = c;
    if (!hasInk[c] && start >= 0) {
      ranges.push([start, c - 1]);
      start = -1;
    }
  }
  if (start >= 0) ranges.push([start, width - 1]);
  return ranges;
}

// Hand-drawn 9-row pixel letterforms for the entire wordmark rotation
// (HELLO included) — NOT a font rendered through canvas. Every letter
// keeps its main straight strokes 2 cells thick, but the cross-strokes
// (H's bar, E/T's bar, L's foot, the taper on O's cap, N/M's diagonals)
// are only 1 cell — the same thick-stroke/thin-crossbar contrast N and M
// already had, now applied consistently across the whole set so no letter
// (including HELLO's own H/E/L/O) is a flat, uniform-weight outlier.
const GLYPHS_THICK: Record<string, string[]> = {
  H: ["XX...XX","XX...XX","XX...XX","XXXXXXX","XX...XX","XX...XX","XX...XX","XX...XX","XX...XX"],
  E: ["XXXXXX","XXXXXX","XX....","XXXXX.","XX....","XX....","XX....","XXXXXX","XXXXXX"],
  L: ["XX....","XX....","XX....","XX....","XX....","XX....","XX....","XX....","XXXXXX"],
  O: [".XXXXX.",".XXXXX.","XX...XX","XX...XX","XX...XX","XX...XX","XX...XX",".XXXXX.",".XXXXX."],
  C: [".XXXXX.","XXXXXXX","XX.....","XX.....","XX.....","XX.....","XX.....","XXXXXXX",".XXXXX."],
  N: ["XXX..XX","XXX..XX","XX.X.XX","XX.X.XX","XX.X.XX","XX.X.XX","XX..XXX","XX..XXX","XX..XXX"],
  P: ["XXXXX..","XXXXXX.","XX...XX","XX...XX","XXXXXX.","XXXXX..","XX.....","XX.....","XX....."],
  T: ["XXXXXXX","XXXXXXX","..XX...","..XX...","..XX...","..XX...","..XX...","..XX...","..XX..."],
  U: ["XX...XX","XX...XX","XX...XX","XX...XX","XX...XX","XX...XX","XX...XX","XXXXXXX",".XXXXX."],
  I: ["XX","XX","XX","XX","XX","XX","XX","XX","XX"],
  M: ["XXX...XXX","XXX...XXX","XX.X.X.XX","XX.X.X.XX","XX..X..XX","XX.....XX","XX.....XX","XX.....XX","XX.....XX"],
};

// Thinner fallback set (1-cell strokes instead of 2) — used only when a
// word would otherwise come out too wide for the layout at the thick
// weight (see layoutHello's overflow check). Same 9-row height throughout,
// just narrower letters, so swapping weight never changes the wordmark's
// vertical size, only how much horizontal room it needs.
const GLYPHS_THIN: Record<string, string[]> = {
  H: ["X..X","X..X","X..X","X..X","XXXX","X..X","X..X","X..X","X..X"],
  E: ["XXXX","X...","X...","X...","XXX.","X...","X...","X...","XXXX"],
  L: ["X...","X...","X...","X...","X...","X...","X...","X...","XXXX"],
  O: [".XX.","X..X","X..X","X..X","X..X","X..X","X..X","X..X",".XX."],
  C: [".XX.","X...","X...","X...","X...","X...","X...","X...",".XX."],
  N: ["X...X","XX..X","XX..X","X.X.X","X.X.X","X.X.X","X..XX","X..XX","X...X"],
  P: ["XXX.","X..X","X..X","X..X","XXX.","X...","X...","X...","X..."],
  T: ["XXXXX","..X..","..X..","..X..","..X..","..X..","..X..","..X..","..X.."],
  U: ["X...X","X...X","X...X","X...X","X...X","X...X","X...X","X...X",".XXX."],
  I: ["X","X","X","X","X","X","X","X","X"],
  M: ["X...X","XX.XX","X.X.X","X.X.X","X...X","X...X","X...X","X...X","X...X"],
};

// Short (6-row) glyph set for "UI" — renders smaller and more compact.
// Only U and I, since "UI" is the only word that uses this set. U must
// close at the bottom (open sides + a tapered cap row) — without that
// closure it's just two parallel verticals, indistinguishable from I.
const GLYPHS_SHORT: Record<string, string[]> = {
  U: ["X...X","X...X","X...X","X...X","X...X",".XXX."],
  I: ["X","X","X","X","X","X"],
};

// Concatenate hand-drawn glyphs left to right with a fixed gap column
// count (HELLO's own letters are 2 columns apart — measured directly off
// PORTRAIT_HELLO), producing the same "rows of '.'/'X'" bitmap format the
// rest of the mosaic pipeline already expects. Pure data concatenation —
// no canvas, no font, no live text rendering at all.
function composeWord(word: string, glyphs: Record<string, string[]>, gapCols: number): string[] {
  const letters = word.toUpperCase().split("").filter((ch) => glyphs[ch]);
  if (letters.length === 0) return glyphs.O ?? ["X"];
  const rows = glyphs[letters[0]].length;
  const lines: string[] = new Array(rows).fill("");
  letters.forEach((ch, i) => {
    const g = glyphs[ch];
    for (let r = 0; r < rows; r++) {
      lines[r] += g[r];
      if (i < letters.length - 1) lines[r] += ".".repeat(gapCols);
    }
  });
  return lines;
}

/**
 * Hero: fine 8px pixel grid (hero-only, see index.css) + cursor-reactive
 * heat canvas + the pixel self-portrait.
 *
 * The portrait is the hero's anchor image — the meaningful pixels replacing
 * plain random flicker. Design notes:
 *
 * 1. Sparks + ambient flicker fill the whole field, including underneath the
 *    copy — there's no manual exclusion mask for text. The effect is a
 *    canvas layer that paints behind the real DOM text (`[data-text-block]`,
 *    still measured live, but only to size the layout — see `topBand`
 *    below); the text's own solid colour sits on its own stacking layer on
 *    top and simply occludes whatever the canvas draws underneath. Effect
 *    and copy never need to negotiate space, so nothing ever looks clipped.
 * 2. Completeness + scale: the portrait is bottom-aligned, its resting
 *    bottom row flush with the hero's own bottom edge (齊下), sized to use
 *    nearly all the space below the measured text block, never cropped.
 * 3. HELLO is a separate, big, bold uppercase wordmark, placed independently
 *    to the right of the portrait, with its own looping life: in (scatter-
 *    reveal, letters in random overlapping order) → hold (3-4s) → out
 *    (mirrored scatter-dissolve) → a blank gap (ambient sparks freely show
 *    through) → repeat. There is only ONE set of cells for the whole
 *    wordmark (the real letter-shaped mosaic) and only one draw path for
 *    them — every visible pixel, whether solid ink or blue-accented, is one
 *    of those cells, coloured by its own continuous state. Nothing blue is
 *    ever conjured by a second, independent system layered on top: no
 *    separately-timed "sparkle" cells, no separate random-noise pass. Each
 *    cell's own fade-in/out and colour (ink ↔ a blue accent) is a single
 *    continuous curve keyed off an absolute timestamp, not a per-phase
 *    switch — so there's never a hard cut between "transitioning" and
 *    "settled" rendering, and never a batch of independently-spawned blue
 *    cells popping in or out together (both bugs we hit came from exactly
 *    that: a second system painting blue cells with its own timer, unrelated
 *    to the real cells' timer). The mosaic unit is deliberately the same
 *    16px grid as the ambient flicker dots, not big letter blocks.
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
    // Soft dampening (0 = normal, up to ~1 = strongest) applied to the
    // passive ambient spark ignition near the face and the text blocks —
    // NOT a hard exclusion mask (nothing is ever fully zeroed out; sparks
    // still occasionally show through, just rarer/dimmer), and the
    // dampening fades smoothly with distance so there's no rectangular
    // cutoff edge. Rebuilt in resize() whenever the grid/layout changes.
    let coolMask: Float32Array = new Float32Array(0);
    let ink: Uint8Array = new Uint8Array(0); // heat cells covered by the portrait's ink
    let helloAllOn: Uint8Array = new Uint8Array(0); // hello's full ink footprint at the 16px grid (static; used by the reduced-motion fallback)
    let helloOn: Uint8Array = new Uint8Array(0); // hello cells actually visible THIS frame, recomputed every frame from the cells' own continuous state
    // Ambient-grid halo masks around the eye/hair/mouth zones (ink cells of
    // that zone, dilated a few cells out) — reuse the SAME heat[]/colorFor()
    // ambient-spark pipeline for the eye/hair "on fire" flicker instead of a
    // second, independently-timed sparkle system (that duplication is
    // exactly what caused the repeated HELLO bugs above). `mouthZoneMask` is
    // used purely as a hover hit-test, no boosted sparks.
    let eyeHaloMask: Uint8Array = new Uint8Array(0);
    let hairHaloMask: Uint8Array = new Uint8Array(0);
    let mouthZoneMask: Uint8Array = new Uint8Array(0);
    let raf = 0;
    let t = 0;
    const mouse = { x: -9999, y: -9999 };

    const INK_RGB: [number, number, number] = [27, 35, 51]; // #1b2333
    const BLUE_RGB: [number, number, number] = [61, 95, 206]; // #3d5fce
    const BLUE_LIGHT_RGB: [number, number, number] = [91, 126, 232]; // #5b7ee8
    const ILLUM = 42; // px radius the cursor lights ink to white
    const FIRE_ILLUM = 34; // px radius for eye/hair — small and tight, not a
    // big halo: the point is a compact hot spot that follows the cursor.
    // The "on fire" gradient for the eye/hair hover reaction — the same
    // warm colours the ambient sparks already use at high heat, so it reads
    // as the same fire, not a new palette. Never white.
    // Weighted so red/orange come up far more often than the yellow
    // highlight — "red and orange" should be the obvious read, not a rare
    // accent buried in mostly-yellow.
    const FIRE_WARM_STOPS: Array<[number, number, number]> = [
      [232, 168, 56], // #e8a838 orange
      [216, 70, 47], // #d8462f red
      [232, 168, 56], // orange again
      [216, 70, 47], // red again
      [244, 233, 74], // #f4e94a yellow (rare)
    ];

    function randRange(min: number, max: number): number {
      return min + Math.random() * (max - min);
    }
    function mixRgb(
      a: [number, number, number],
      b: [number, number, number],
      t: number
    ): [number, number, number] {
      return [
        Math.round(a[0] + (b[0] - a[0]) * t),
        Math.round(a[1] + (b[1] - a[1]) * t),
        Math.round(a[2] + (b[2] - a[2]) * t),
      ];
    }
    // k: 0 at the hot-spot's rim (fading to ink) .. 1 right at the cursor.
    // twinkle: a per-cell, per-frame hashed 0..1 that (a) picks which warm
    // hue — red / orange / yellow — is lit near the centre this instant, and
    // (b) is reused by the caller to flicker cells in/out near the rim, so
    // the whole hot spot visibly sparkles instead of sitting as one static
    // gradient. Blue owns the outer band, the twinkling warm hue owns the
    // centre; it is never white.
    function fireBlend(k: number, twinkle: number): [number, number, number] {
      const warm =
        FIRE_WARM_STOPS[Math.floor(twinkle * FIRE_WARM_STOPS.length) % FIRE_WARM_STOPS.length];
      if (k < 0.25) {
        return mixRgb(BLUE_RGB, BLUE_LIGHT_RGB, Math.max(0, k) / 0.25);
      }
      if (k < 0.55) {
        return mixRgb(BLUE_LIGHT_RGB, warm, (k - 0.25) / 0.3);
      }
      // The inner ~45% of the radius is a solid, saturated warm colour (no
      // blue mixed in) — a clearly red/orange core, not a thin sliver at
      // the exact centre pixel.
      return warm;
    }

    const P_ROWS = PORTRAIT_FACE.length;
    const P_COLS = PORTRAIT_FACE[0].length;

    // The wordmark rotates through these, forever: HELLO keeps its
    // hand-tuned bitmap (already right, don't touch it); the rest are
    // composed from the hand-drawn glyphs above (see composeWord), at the
    // same row height, so the whole assemble/hold/disassemble pipeline
    // below runs identically no matter which word is active.
    const HELLO_WORDS = ["HELLO", "CONCEPT", "UI", "MOTION"];
    const HELLO_LETTER_GAP = 2; // columns — matches PORTRAIT_HELLO's own gap
    const HELLO_LETTER_GAP_THIN = 2;
    const HELLO_LETTER_GAP_UI = 4; // wider spacing for U–I in the short set
    let helloWordIdx = 0;
    let activeHelloBitmap: string[] = composeWord("HELLO", GLYPHS_THICK, HELLO_LETTER_GAP);
    let hRows = activeHelloBitmap.length;
    let hCols = activeHelloBitmap[0].length;
    let helloLetterRanges: Array<[number, number]> = computeLetterRanges(activeHelloBitmap);
    let helloIsThin = false; // which glyph weight the active word used

    // Every word goes through composeWord() with the appropriate glyph set.
    // UI gets special treatment: short (6-row) glyphs with wider letter spacing.
    function setHelloWord(word: string, thin = false) {
      if (word === "UI") {
        activeHelloBitmap = composeWord(word, GLYPHS_SHORT, HELLO_LETTER_GAP_UI);
        helloIsThin = false; // flag for special layout handling
      } else {
        activeHelloBitmap = composeWord(
          word,
          thin ? GLYPHS_THIN : GLYPHS_THICK,
          thin ? HELLO_LETTER_GAP_THIN : HELLO_LETTER_GAP
        );
        helloIsThin = thin;
      }
      hRows = activeHelloBitmap.length;
      hCols = activeHelloBitmap[0].length;
      helloLetterRanges = computeLetterRanges(activeHelloBitmap);
    }

    // Short, simple words (few letters, mostly straight strokes — "UI" is
    // the case that prompted this) read visually bolder than longer words
    // at the very same cell size: less counter-space/white per letter, so
    // the same 2-cell stroke looks chunkier. Default anything this short to
    // the thin weight up front, instead of only reacting to it after the
    // fact; longer words still start thick and only drop to thin if
    // layoutHello's overflow check says they don't fit.
    const SHORT_WORD_MAX_LETTERS = 3;
    function defaultThinFor(word: string): boolean {
      return word.length <= SHORT_WORD_MAX_LETTERS;
    }

    // Eye band + closed-lid line used for the blink beat (row/col indices
    // into PORTRAIT_FACE — spans both glasses lenses).
    const EYE_R0 = 18;
    const EYE_R1 = 23;
    const EYE_C0 = 8;
    const EYE_C1 = 33;
    const EYE_LID_ROW = 20;
    const LID_L: [number, number] = [11, 16];
    const LID_R: [number, number] = [23, 28];
    // Flattened cells for the closed-lid line, same reason as
    // MOUTH_EXTRA_CELLS below: excluded from ambient sparks permanently,
    // not just mid-blink.
    const LID_CELLS: Array<[number, number]> = [
      ...Array.from({ length: LID_L[1] - LID_L[0] + 1 }, (_, i): [number, number] => [EYE_LID_ROW, LID_L[0] + i]),
      ...Array.from({ length: LID_R[1] - LID_R[0] + 1 }, (_, i): [number, number] => [EYE_LID_ROW, LID_R[0] + i]),
    ];
    // Extra cells drawn for the smile beat (within the head band, so they
    // ride the head's bob) — deliberately small and close to the resting
    // mouth's own footprint (row 33, cols 17-22): a 1-cell corner curl
    // directly above each end of that line, plus a short lower lip. Not a
    // wide grin — after repeated "still too open" feedback, smaller is the
    // fix, not more ink.
    const MOUTH_EXTRA: Array<[number, number, number]> = [
      [32, 17, 17],
      [32, 22, 22],
      [33, 17, 22],
      [34, 19, 20],
    ];
    // Flattened (row, col) pairs for every cell above, plus the closed-lid
    // line — passed to stampInkCells() so these "beat-only" cells are
    // excluded from ambient sparks permanently, not just while the beat
    // that draws them is playing (see stampInkCells' comment).
    const MOUTH_EXTRA_CELLS: Array<[number, number]> = MOUTH_EXTRA.flatMap(
      ([r, c0, c1]) => {
        const out: Array<[number, number]> = [];
        for (let c = c0; c <= c1; c++) out.push([r, c]);
        return out;
      }
    );

    // Interactive hover zones on the portrait, used to give the cursor a
    // different reaction over the eyes, the hair, and the mouth than over
    // the rest of the face/body. Bitmap-space boxes, classified per ink
    // cell by zoneForCell() below — geometric approximations (the source
    // bitmap is line art with no material tag), tuned by eye against
    // renders rather than derived from anything exact.
    const MOUTH_ZONE_R0 = 30;
    const MOUTH_ZONE_R1 = 36;
    const MOUTH_ZONE_C0 = 14;
    const MOUTH_ZONE_C1 = 26;
    // Hair: the solid bangs across the top, plus the side locks/sideburns
    // that frame the face outside the glasses band in the rows just below.
    // The side-lock columns are read directly off PORTRAIT_FACE's own ink
    // runs (rows 7-20 consistently have ink at cols ~4-14 on the left and
    // ~27-38 on the right) rather than "everything outside the eye box" —
    // the eye box (EYE_C0..EYE_C1 = 8..33) is wide enough that it used to
    // swallow almost the whole side lock, leaving the sides never
    // classified as hair at all.
    const HAIR_TOP_R0 = 0;
    const HAIR_TOP_R1 = 6;
    const HAIR_SIDE_R0 = 7;
    const HAIR_SIDE_R1 = 20;
    const HAIR_SIDE_LEFT_MAX_C = 14; // c <= this, on the left, counts as hair
    const HAIR_SIDE_RIGHT_MIN_C = 27; // c >= this, on the right, counts as hair

    type PortraitZone = "eye" | "hair" | "mouth" | "other";
    function zoneForCell(r: number, c: number): PortraitZone {
      if (r >= EYE_R0 && r <= EYE_R1 && c >= EYE_C0 && c <= EYE_C1) return "eye";
      if (r >= MOUTH_ZONE_R0 && r <= MOUTH_ZONE_R1 && c >= MOUTH_ZONE_C0 && c <= MOUTH_ZONE_C1) return "mouth";
      if (r >= HAIR_TOP_R0 && r <= HAIR_TOP_R1) return "hair";
      if (
        r >= HAIR_SIDE_R0 &&
        r <= HAIR_SIDE_R1 &&
        (c <= HAIR_SIDE_LEFT_MAX_C || c >= HAIR_SIDE_RIGHT_MIN_C)
      )
        return "hair";
      return "other";
    }

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

    // ---- HELLO's assemble/hold/disassemble loop -----------------------
    //
    // helloCells: every 16px ambient cell that's actually inside a letter's
    // ink (a full raster tiling of the wordmark at the ambient grid's own
    // resolution — NOT one point-sample per source bitmap pixel — so the
    // mosaic reads as solid/filled once revealed, identical whether it's
    // mid-transition or holding).
    //
    // Each cell's on-screen appearance (alpha + colour) is a pure function
    // of "how long ago did it start revealing" / "how long ago did it start
    // hiding", using absolute rAF timestamps (revealAtAbs / hideAtAbs). That
    // makes fade-in, the ink↔accent colour settle, and the eventual steady
    // "hold" look all ONE continuous curve per cell — there's no separate
    // "transition" vs "settled" code path to jump between.
    //
    // Cells just OUTSIDE the real letter footprint (the "breaks the grid"
    // overflow glitch) are regular members of this SAME array, flagged
    // `isPhantom` — they get their reveal/hide scheduled by the exact same
    // beginHelloSweep() pass and rendered by the exact same drawHelloCells()
    // loop as every real ink cell. There is no second array, no second
    // timer, no second draw call: a phantom cell IS a HelloCell, just one
    // with no ink identity of its own (accent is never null for it, so it
    // always reads as blue/light-blue instead of settling to ink).
    type HelloCell = {
      gx: number;
      gy: number;
      letter: number;
      isEdge: boolean; // touches a non-ink cell — eligible for the edge-skip glitch
      isPhantom: boolean; // no ink identity — an overflow cell, always accent-coloured
      accent: [number, number, number] | null; // this cycle's accent colour, or null = stays ink the whole time
      revealAtAbs: number; // rAF timestamp this cell starts appearing; Infinity = not scheduled
      hideAtAbs: number; // rAF timestamp this cell starts disappearing; Infinity = not scheduled
    };
    let helloCells: HelloCell[] = [];

    const HELLO_SWEEP_BASE = 1100; // ms, how widely each direction's per-cell start times spread out
    const HELLO_HOLD_MIN = 3000;
    const HELLO_HOLD_MAX = 4000;
    const HELLO_GAP_MIN = 500;
    const HELLO_GAP_MAX = 1000;
    const HELLO_FADE_MS = 260; // per-cell fade duration — a real fade, not a blink
    const HELLO_COLOR_MS = 550; // per-cell ink↔accent colour settle duration
    const EDGE_SKIP_P = 0.28; // chance an edge cell drops out for a frame while it's itself mid-fade

    let helloSweepDur = HELLO_SWEEP_BASE;
    type HelloPhase = "in" | "hold" | "out" | "gap";
    let helloPhase: HelloPhase = "hold";
    let helloNextChange = -1;

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

    // The blink/smile beats paint cells that AREN'T in the base bitmap (the
    // closed-lid line, the enlarged smile). Those cells must still be
    // permanently excluded from the ambient spark layer even while the beat
    // isn't playing — otherwise, the instant it ends, ambient sparks are
    // free to flicker into that exact gap (no `ink[]` entry says otherwise),
    // which reads as a ghostly leftover smile/eyelid built from unrelated
    // spark noise. Same lesson as the HELLO bugs: one static exclusion mask,
    // not "on" cells excluded and "off" cells not.
    function stampInkCells(cells: Array<[number, number]>, originX: number, originY: number, sizeX: number, sizeY: number) {
      for (const [r, c] of cells) {
        const gx = Math.floor((originX + c * sizeX + sizeX / 2) / cell);
        const gy = Math.floor((originY + r * sizeY + sizeY / 2) / cell);
        if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) ink[gy * cols + gx] = 1;
      }
    }

    // Rasterize one portrait zone's ink onto the ambient 16px grid, then
    // dilate it by `haloRadius` cells (a filled circle) — this both marks
    // the zone for the eye/hair hover hit-test AND, for eye/hair, defines
    // exactly where the boosted "on fire" ambient sparks are allowed to
    // ignite. `mask` is written in place; call once per zone in resize().
    function stampZoneHalo(mask: Uint8Array, zone: PortraitZone, haloRadiusPx: number) {
      // Radius is in on-screen px, scaled from the portrait's OWN cell size
      // by the caller — not a fixed ambient-cell count. A fixed cell count
      // would stay the same physical size regardless of how big the
      // portrait itself renders, so on a smaller viewport (smaller pCellY)
      // it would balloon relative to the face and bleed one zone's halo
      // into another (eye halo reaching all the way down to the mouth).
      const haloRadius = Math.max(1, Math.round(haloRadiusPx / cell));
      for (let r = 0; r < P_ROWS; r++) {
        const row = PORTRAIT_FACE[r];
        for (let c = 0; c < P_COLS; c++) {
          if (row[c] !== "X") continue;
          if (zoneForCell(r, c) !== zone) continue;
          const cx = Math.floor((pX + c * pCellX + pCellX / 2) / cell);
          const cy = Math.floor((pY + r * pCellY + pCellY / 2) / cell);
          for (let dy = -haloRadius; dy <= haloRadius; dy++) {
            for (let dx = -haloRadius; dx <= haloRadius; dx++) {
              if (dx * dx + dy * dy > haloRadius * haloRadius) continue; // circular, not square
              const gx = cx + dx;
              const gy = cy + dy;
              if (gx < 0 || gx >= cols || gy < 0 || gy >= rows) continue;
              mask[gy * cols + gx] = 1;
            }
          }
        }
      }
    }

    function letterIndexForCol(c: number): number {
      for (let i = 0; i < helloLetterRanges.length; i++) {
        const [s, e] = helloLetterRanges[i];
        if (c >= s && c <= e) return i;
      }
      return 0;
    }

    // Rasterize HELLO onto the 16px ambient grid: for every candidate cell
    // inside the wordmark's bounding box, sample its centre against the
    // source bitmap. This fully tiles each letter (unlike sampling one point
    // per source pixel), so the mosaic reads as solid/filled once revealed.
    // The ring of cells just outside that footprint (the overflow glitch)
    // is appended into the SAME `helloCells` array, tagged `isPhantom` —
    // they're built here, scheduled by beginHelloSweep(), and drawn by
    // drawHelloCells() exactly like every ink cell, never through a
    // separate array or a separate per-frame roll.
    function buildHelloCells() {
      const gx0 = Math.max(0, Math.floor(helloX / cell));
      const gx1 = Math.min(cols - 1, Math.floor((helloX + hCols * helloCell) / cell));
      const gy0 = Math.max(0, Math.floor(helloY / cell));
      const gy1 = Math.min(rows - 1, Math.floor((helloY + hRows * helloCell) / cell));

      const bitmapColRowAt = (gx: number, gy: number): [number, number] => {
        const px = gx * cell + cell / 2;
        const py = gy * cell + cell / 2;
        return [Math.floor((px - helloX) / helloCell), Math.floor((py - helloY) / helloCell)];
      };
      const inkAt = (gx: number, gy: number): boolean => {
        const [bc, br] = bitmapColRowAt(gx, gy);
        if (br < 0 || br >= hRows || bc < 0 || bc >= hCols) return false;
        return activeHelloBitmap[br][bc] === "X";
      };

      const cellSet = new Set<number>();
      helloCells = [];
      for (let gy = gy0; gy <= gy1; gy++) {
        for (let gx = gx0; gx <= gx1; gx++) {
          if (!inkAt(gx, gy)) continue;
          const [bc] = bitmapColRowAt(gx, gy);
          cellSet.add(gy * cols + gx);
          helloCells.push({
            gx,
            gy,
            letter: letterIndexForCol(bc),
            isEdge: false,
            isPhantom: false,
            accent: null,
            revealAtAbs: Infinity,
            hideAtAbs: Infinity,
          });
        }
      }

      const NBR: Array<[number, number]> = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      for (const hc of helloCells) {
        hc.isEdge = NBR.some(
          ([dx, dy]) => !cellSet.has((hc.gy + dy) * cols + (hc.gx + dx))
        );
      }

      const phantomKeys = new Set<number>();
      const edgeCells = helloCells.filter((hc) => hc.isEdge);
      for (const hc of edgeCells) {
        for (const [dx, dy] of NBR) {
          const nx = hc.gx + dx;
          const ny = hc.gy + dy;
          if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
          const key = ny * cols + nx;
          if (cellSet.has(key) || phantomKeys.has(key)) continue;
          phantomKeys.add(key);
          helloCells.push({
            gx: nx,
            gy: ny,
            letter: hc.letter, // inherits the neighbouring letter's reveal timing
            isEdge: true,
            isPhantom: true,
            accent: null, // rolled fresh every sweep in beginHelloSweep, same as any cell
            revealAtAbs: Infinity,
            hideAtAbs: Infinity,
          });
        }
      }

      helloAllOn = new Uint8Array(cols * rows);
      for (const hc of helloCells) {
        if (!hc.isPhantom) helloAllOn[hc.gy * cols + hc.gx] = 1;
      }
      helloOn = new Uint8Array(cols * rows);
    }

    // Reshuffle the 5 letters into a fresh random order and schedule every
    // cell's reveal (direction "in") or hide (direction "out") moment: a
    // per-letter centre (spaced across helloSweepDur by the shuffled order)
    // plus a WIDE random spread, so cells overlap heavily across letters and
    // within a letter — reads as noise resolving into shape, not a neat
    // per-letter block-flash. Each cell also rerolls whether it gets an
    // accent-colour flash this cycle. For real ink cells, only the
    // timestamp field for the ACTIVE direction is (re)armed; the other
    // stays whatever it was, which is exactly what lets "in" continue
    // smoothly into "hold" and beyond. Phantom cells have no "hold" state
    // to settle into, so both ends of their life are (re)armed together,
    // every sweep, in either direction — a fully self-contained blip that's
    // guaranteed to have finished fading out well before the sweep ends,
    // never left lit through hold or gap.
    function beginHelloSweep(direction: "in" | "out", phaseStartAbs: number) {
      const letterCount = Math.max(1, helloLetterRanges.length);
      const order = Array.from({ length: letterCount }, (_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      const slot = helloSweepDur / letterCount;
      const letterCenter: number[] = new Array(letterCount);
      order.forEach((letterIdx, slotPos) => {
        letterCenter[letterIdx] = (slotPos + 0.5) * slot;
      });
      const spread = helloSweepDur * 0.55;
      for (const hc of helloCells) {
        const raw = letterCenter[hc.letter] + (Math.random() - 0.5) * spread;
        const offset = Math.max(0, Math.min(helloSweepDur, raw));
        if (hc.isPhantom) {
          // No ink identity to settle into, so it's always one of the two
          // accents — same roll mechanism as any real cell, just without
          // the "or null" option.
          hc.accent = Math.random() < 0.5 ? BLUE_RGB : BLUE_LIGHT_RGB;
          const blipStart = phaseStartAbs + offset;
          hc.revealAtAbs = blipStart;
          hc.hideAtAbs = blipStart + randRange(120, 340);
          continue;
        }
        const colorRoll = Math.random();
        hc.accent = colorRoll < 0.12 ? BLUE_RGB : colorRoll < 0.24 ? BLUE_LIGHT_RGB : null;
        if (direction === "in") {
          hc.revealAtAbs = phaseStartAbs + offset;
          hc.hideAtAbs = Infinity; // invalidate any stale schedule from the previous cycle
        } else {
          hc.hideAtAbs = phaseStartAbs + offset;
          // revealAtAbs is left as-is: it's long in the past, so this cell
          // keeps reading as "fully revealed" right up until its own hide
          // time arrives below.
        }
      }
    }

    // The single source of truth for what a cell looks like right now: a
    // continuous fade + colour-settle curve keyed off absolute time, with no
    // dependency on which macro phase we're nominally in. "Hold" isn't a
    // separately-drawn state — it's just what this naturally settles into.
    function helloCellVisual(
      hc: HelloCell,
      now: number
    ): { alpha: number; color: [number, number, number] } | null {
      if (now >= hc.hideAtAbs) {
        const since = now - hc.hideAtAbs;
        const alpha = 1 - Math.min(1, since / HELLO_FADE_MS);
        if (alpha <= 0.003) return null;
        // Phantom cells have no ink identity to settle into — they stay
        // whichever accent they were dyed this cycle for their whole life.
        if (hc.isPhantom) return { alpha, color: hc.accent as [number, number, number] };
        const colorMix = Math.min(1, since / HELLO_COLOR_MS); // ink -> accent as it prepares to leave
        const color = hc.accent ? mixRgb(INK_RGB, hc.accent, colorMix) : INK_RGB;
        return { alpha, color };
      }
      if (now >= hc.revealAtAbs) {
        const since = now - hc.revealAtAbs;
        const alpha = Math.min(1, since / HELLO_FADE_MS);
        if (alpha <= 0.003) return null;
        if (hc.isPhantom) return { alpha, color: hc.accent as [number, number, number] };
        const colorMix = 1 - Math.min(1, since / HELLO_COLOR_MS); // accent -> ink as it settles in
        const color = hc.accent ? mixRgb(INK_RGB, hc.accent, colorMix) : INK_RGB;
        return { alpha, color };
      }
      return null;
    }

    function paintCell(
      x: number,
      y: number,
      w: number,
      h: number,
      pad = 0,
      base: [number, number, number] = INK_RGB,
      alpha = 1,
      fire = false // eye/hair zones: cursor proximity blends toward the fire gradient instead of white
    ) {
      let color: string;
      const illumRadius = fire ? FIRE_ILLUM : ILLUM;
      if (mouse.x > -500) {
        const dx = x + w / 2 - mouse.x;
        const dy = y + h / 2 - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < illumRadius) {
          const k = 1 - d / illumRadius;
          if (fire) {
            // Per-cell, per-frame flicker (not a fixed gradient): every lit
            // cell's hue twinkles, and the outer ~35% of the hot spot's
            // radius randomly ducks back to ink for a frame, so the sparkle
            // visibly reaches all the way to the rim instead of stopping at
            // a smooth edge.
            const twinkle = hash(x * 0.07 + 1.7, y * 0.09 + t * 0.35);
            const edgeRoll = hash(x * 0.11 + 3.3, y * 0.13 + t * 0.41);
            if (k < 0.35 && edgeRoll < 0.4) {
              color = `rgb(${base[0]}, ${base[1]}, ${base[2]})`;
            } else {
              const [fr, fg, fb] = fireBlend(k, twinkle);
              color = `rgb(${fr}, ${fg}, ${fb})`;
            }
          } else {
            const ch = Math.round(base[0] + (255 - base[0]) * k);
            const cg = Math.round(base[1] + (255 - base[1]) * k);
            const cb = Math.round(base[2] + (255 - base[2]) * k);
            color = `rgb(${ch}, ${cg}, ${cb})`;
          }
        } else {
          color = `rgb(${base[0]}, ${base[1]}, ${base[2]})`;
        }
      } else {
        color = `rgb(${base[0]}, ${base[1]}, ${base[2]})`;
      }
      if (alpha < 1) ctx!.globalAlpha = Math.max(0, alpha);
      ctx!.fillStyle = color;
      if (pad) ctx!.fillRect(x - pad, y - pad, w + pad * 2, h + pad * 2);
      else ctx!.fillRect(x, y, w, h);
      if (alpha < 1) ctx!.globalAlpha = 1;
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
      const neckRows = BODY_TOP - (HEAD_END + 1);
      // Each neck row's own paint height stretches with however far apart
      // the chin and collar currently are, instead of a fixed pCellY+2 — so
      // whatever the breathing amplitude, consecutive neck rows always
      // overlap enough to cover the gap and the head can never visibly
      // detach from the body.
      const neckSpan = Math.abs(collarTopY - chinBottomY);
      const neckDraw = Math.max(hDraw, neckSpan / Math.max(1, neckRows) + 2);
      for (let r = HEAD_END + 1; r < BODY_TOP; r++) {
        const row = PORTRAIT_FACE[r];
        const yNat = pY + r * pCellY;
        const frac = (yNat - natTop) / (natBottom - natTop);
        const y = chinBottomY + frac * (collarTopY - chinBottomY);
        for (let c = 0; c < P_COLS; c++) {
          if (row[c] === "X") paintCell(pX + c * pCellX, y, pCellX, neckDraw);
        }
      }

      // --- HEAD (hair + face + chin): bobs as one rigid sprite, on top.
      // Eye and hair ink light up in the fire gradient under the cursor
      // instead of the plain white glow everything else uses. ---
      for (let r = 0; r <= HEAD_END; r++) {
        const row = PORTRAIT_FACE[r];
        const y = pY + r * pCellY + headDy;
        const inEyeRow = blinking && r >= EYE_R0 && r <= EYE_R1;
        for (let c = 0; c < P_COLS; c++) {
          if (row[c] !== "X") continue;
          if (inEyeRow && c >= EYE_C0 && c <= EYE_C1) continue;
          const zone = zoneForCell(r, c);
          paintCell(pX + c * pCellX, y, pCellX, hDraw, 0, INK_RGB, 1, zone === "eye" || zone === "hair");
        }
      }
      if (blinking) {
        const y = pY + EYE_LID_ROW * pCellY + headDy;
        for (let c = LID_L[0]; c <= LID_L[1]; c++)
          paintCell(pX + c * pCellX, y, pCellX, hDraw, 0, INK_RGB, 1, true);
        for (let c = LID_R[0]; c <= LID_R[1]; c++)
          paintCell(pX + c * pCellX, y, pCellX, hDraw, 0, INK_RGB, 1, true);
      }
      if (mouthOpen) {
        for (const [r, c0, c1] of MOUTH_EXTRA) {
          const y = pY + r * pCellY + headDy;
          for (let c = c0; c <= c1; c++)
            paintCell(pX + c * pCellX, y, pCellX, hDraw);
        }
      }
    }

    // Draw every HELLO cell — real letter ink and overflow phantom alike —
    // wherever its own continuous fade/colour curve says it should show
    // right now. One array, one loop, one draw call, covering "in", "hold"
    // and "out" alike, so there's no seam between "transitioning" and
    // "settled", and nothing blue ever comes from anywhere else. Edge cells
    // occasionally drop out for a frame while THEY THEMSELVES are still
    // mid-fade (not tied to a global timer), so the glitch always fades
    // with the cell rather than snapping off at some fixed instant.
    function drawHelloCells(now: number, noiseFrame: number) {
      for (const hc of helloCells) {
        const vis = helloCellVisual(hc, now);
        if (!vis) continue;
        if (hc.isEdge && vis.alpha > 0.04 && vis.alpha < 0.96) {
          const skipRoll = hash(hc.gx * 4.3 + 1.1, hc.gy * 6.7 + noiseFrame * 0.53);
          if (skipRoll < EDGE_SKIP_P) continue;
        }
        paintCell(hc.gx * cell + 1, hc.gy * cell + 1, cell - 2, cell - 2, 0, vis.color, vis.alpha);
      }
    }

    // Mark which 16px cells are actually showing right now, straight from
    // each cell's own continuous state — used so the ambient spark loop
    // (which runs first) skips them, whatever phase we're in.
    function markHelloOn(now: number) {
      helloOn.fill(0);
      for (const hc of helloCells) {
        if (helloCellVisual(hc, now)) helloOn[hc.gy * cols + hc.gx] = 1;
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

    // HELLO's placement/size: sized off the viewport, clamped to the
    // right-hand margin so it never overlaps the portrait, vertically
    // centred on the portrait's face. Extracted from resize() so a word
    // rotation (which changes hCols, since each word is a different width)
    // can re-run just this part without a full canvas resize.
    function layoutHello() {
      const rect = canvas!.getBoundingClientRect();
      let textBottom = 0;
      const section = canvas!.closest("section");
      if (section) {
        section
          .querySelectorAll<HTMLElement>("[data-text-block]")
          .forEach((el) => {
            const r = el.getBoundingClientRect();
            textBottom = Math.max(textBottom, r.bottom - rect.top);
          });
      }
      const topBand = Math.min(Math.max(textBottom + 14, 100), rect.height * 0.58);

      const portraitRight = pX + P_COLS * pCellX;
      const helloEdgeMargin = Math.max(28, rect.width * 0.035);
      const helloGap = 44; // clearance between portrait and the wordmark
      let helloMaxByMargin =
        (rect.width - portraitRight - helloGap - helloEdgeMargin) / hCols;
      // A word too long at the thick (2-cell-stroke) weight would force
      // helloMaxByMargin below a readable size, and the floor a few lines
      // down would then clamp it back up past the margin — the word
      // pressing into the edge/portrait. Rather than let that happen,
      // recompose the same word at the thinner glyph weight (narrower
      // letters, same 9-row height) so it fits at a still-readable size.
      const MIN_READABLE_CELL = 10;
      const currentWord = HELLO_WORDS[helloWordIdx];
      if (!helloIsThin && helloMaxByMargin < MIN_READABLE_CELL) {
        setHelloWord(currentWord, true);
        helloMaxByMargin = (rect.width - portraitRight - helloGap - helloEdgeMargin) / hCols;
      }
      const helloTargetCell = Math.max(pCellY * 3.1, rect.width * 0.02);
      const helloMaxByHeight = ((rect.height - topBand) * 0.5) / hRows;
      helloCell = Math.max(
        6,
        Math.min(helloTargetCell, helloMaxByMargin, helloMaxByHeight, 58)
      );
      const helloW = hCols * helloCell;
      const helloH = hRows * helloCell;
      helloX = Math.floor(rect.width - helloW - helloEdgeMargin);
      // UI is short and narrow; shift it leftward to balance the layout
      // instead of leaving it pressed against the right edge.
      if (currentWord === "UI") {
        helloX = Math.floor(helloX - helloW * 0.8);
      }
      // centre on the portrait's face band (roughly its upper-middle)
      const faceMidY = pY + P_ROWS * pCellY * 0.4;
      helloY = Math.floor(faceMidY - helloH / 2);
    }

    // Raises coolMask[i] (never lowers it — multiple overlapping zones just
    // take the strongest) for grid cells near a rect [x0,y0]-[x1,y1] in
    // canvas px. `corePad` extends the rect itself (full `strength`
    // everywhere inside); `falloffPad` is the extra distance beyond that
    // over which the dampening eases back down to 0 — that gradient is what
    // keeps this from reading as a rectangular hole in the spark field.
    function applyCoolZone(
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      corePad: number,
      falloffPad: number,
      strength: number
    ) {
      const gx0 = Math.max(0, Math.floor((x0 - corePad - falloffPad) / cell));
      const gx1 = Math.min(cols - 1, Math.ceil((x1 + corePad + falloffPad) / cell));
      const gy0 = Math.max(0, Math.floor((y0 - corePad - falloffPad) / cell));
      const gy1 = Math.min(rows - 1, Math.ceil((y1 + corePad + falloffPad) / cell));
      for (let cy = gy0; cy <= gy1; cy++) {
        for (let cx = gx0; cx <= gx1; cx++) {
          const px = cx * cell + cell / 2;
          const py = cy * cell + cell / 2;
          const dx = Math.max(x0 - corePad - px, px - (x1 + corePad), 0);
          const dy = Math.max(y0 - corePad - py, py - (y1 + corePad), 0);
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > falloffPad) continue;
          const f = falloffPad > 0 ? 1 - d / falloffPad : 1;
          const idx = cy * cols + cx;
          coolMask[idx] = Math.max(coolMask[idx], strength * f);
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

      // Measure the real text blocks purely for layout: their union bottom
      // defines where the portrait's band starts. This does NOT build an
      // exclusion mask — the canvas paints under the text everywhere, and
      // the text's own layer (z-10, on top) occludes it naturally. The full
      // rects are also kept for the soft cool-zone dampening built below.
      let textBottom = 0;
      const textRects: Array<{ x0: number; y0: number; x1: number; y1: number }> = [];
      const section = canvas!.closest("section");
      if (section) {
        section
          .querySelectorAll<HTMLElement>("[data-text-block]")
          .forEach((el) => {
            const r = el.getBoundingClientRect();
            textBottom = Math.max(textBottom, r.bottom - rect.top);
            textRects.push({
              x0: r.left - rect.left,
              y0: r.top - rect.top,
              x1: r.right - rect.left,
              y1: r.bottom - rect.top,
            });
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
      headAmp = Math.max(4, Math.round(pCellY * 0.38));
      bodyAmp = Math.max(3, Math.round(pCellY * 0.32));

      layoutHello();

      // Soft dampening zone around the face + every text block: sparks
      // still light up here, just rarer/dimmer, fading smoothly with
      // distance — no hard rectangular cutoff (see applyCoolZone below).
      coolMask = new Float32Array(cols * rows);
      const facePad = pCellY * 1.5;
      applyCoolZone(
        pX - facePad,
        pY - facePad,
        pX + P_COLS * pCellX + facePad,
        pY + P_ROWS * pCellY + facePad,
        0,
        pCellY * 2.5,
        0.85
      );
      for (const r of textRects) {
        applyCoolZone(r.x0, r.y0, r.x1, r.y1, 10, 34, 0.9);
      }

      // Rasterize the portrait's ink onto the heat grid so sparks skip it.
      ink = new Uint8Array(cols * rows);
      stampInk(PORTRAIT_FACE, P_ROWS, P_COLS, pX, pY, pCellX, pCellY);
      stampInkCells(MOUTH_EXTRA_CELLS, pX, pY, pCellX, pCellY);
      stampInkCells(LID_CELLS, pX, pY, pCellX, pCellY);
      // Eye/hair halo masks (boosted "on fire" ambient sparks) and the
      // mouth hover hit-test mask — same rasterize-then-dilate helper for
      // all three, just different zones/radii.
      eyeHaloMask = new Uint8Array(cols * rows);
      hairHaloMask = new Uint8Array(cols * rows);
      mouthZoneMask = new Uint8Array(cols * rows);
      stampZoneHalo(eyeHaloMask, "eye", pCellY * 1.8);
      stampZoneHalo(hairHaloMask, "hair", pCellY * 1.8);
      stampZoneHalo(mouthZoneMask, "mouth", pCellY * 1.2);
      // HELLO gets its own 16px cell map (not folded into `ink`) because its
      // visibility changes every frame during the assemble/disassemble sweep.
      buildHelloCells();
    }

    function drawStatic() {
      const rect = canvas!.getBoundingClientRect();
      ctx!.clearRect(0, 0, rect.width, rect.height);
      ctx!.fillStyle = "#1b2333";
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const i = cy * cols + cx;
          if ((cx + cy) % 11 === 0 && !ink[i] && !helloAllOn[i]) {
            ctx!.fillRect(cx * cell + 1, cy * cell + 1, cell - 2, cell - 2);
          }
        }
      }
      drawPortrait(0, 0, false, false);
      for (const hc of helloCells) {
        if (hc.isPhantom) continue; // no ink identity — not part of the static held word
        paintCell(hc.gx * cell + 1, hc.gy * cell + 1, cell - 2, cell - 2);
      }
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

      // HELLO's in → hold → out → gap loop, forever. This macro phase only
      // schedules WHEN each direction's sweep begins — every visible pixel
      // (ink or accent, letter or overflow phantom) is a member of the same
      // helloCells array with its own continuous alpha/colour curve (see
      // helloCellVisual), so this switch never hands rendering off to a
      // different draw path or a different, independently-timed layer.
      if (helloNextChange < 0) {
        helloPhase = "hold";
        helloNextChange = now + randRange(HELLO_HOLD_MIN, HELLO_HOLD_MAX);
      }
      if (now >= helloNextChange) {
        if (helloPhase === "hold") {
          helloPhase = "out";
          helloSweepDur = randRange(HELLO_SWEEP_BASE * 0.85, HELLO_SWEEP_BASE * 1.15);
          beginHelloSweep("out", now);
          helloNextChange = now + helloSweepDur;
        } else if (helloPhase === "out") {
          helloPhase = "gap";
          helloNextChange = now + randRange(HELLO_GAP_MIN, HELLO_GAP_MAX);
        } else if (helloPhase === "gap") {
          // Advance to the next word in the rotation right at the empty
          // gap — nothing is on screen yet, so swapping the bitmap here is
          // invisible. Rebuilding the bitmap/layout/cells is the same path
          // resize() already uses, just triggered by a word change instead
          // of a viewport change.
          helloWordIdx = (helloWordIdx + 1) % HELLO_WORDS.length;
          const nextWord = HELLO_WORDS[helloWordIdx];
          setHelloWord(nextWord, defaultThinFor(nextWord));
          layoutHello();
          buildHelloCells();
          helloPhase = "in";
          helloSweepDur = randRange(HELLO_SWEEP_BASE * 0.85, HELLO_SWEEP_BASE * 1.15);
          beginHelloSweep("in", now);
          helloNextChange = now + helloSweepDur;
        } else {
          helloPhase = "hold";
          helloNextChange = now + randRange(HELLO_HOLD_MIN, HELLO_HOLD_MAX);
        }
      }
      markHelloOn(now);

      // Two independent breathing cycles, quantised to whole px so the sprite
      // steps like real frames (not a smooth pushpin slide): the head bobs on
      // one period, the chest squashes on a slower, offset one. The neck
      // bridges whatever gap results, so they stay connected.
      const headDy = Math.round(Math.sin(now * 0.0027) * headAmp);
      const bodyPhase = Math.sin(now * 0.0019 + 1.1);

      const mcx = Math.floor(mouse.x / cell);
      const mcy = Math.floor(mouse.y / cell);
      const mouseOnGrid = mouse.x > -500 && mcx >= 0 && mcx < cols && mcy >= 0 && mcy < rows;
      const radius = 3;
      const zoneFireRadius = 2; // ambient cells — small, local "trail" halo
      // that follows the cursor itself (matches FIRE_ILLUM's tight radius),
      // so eye/hair sparks only ignite right around the pointer, not the
      // whole zone mask at once.
      const noiseFrame = Math.floor(t / 50);

      // The mouth reacts the instant the cursor is over it — smiles for as
      // long as it lingers, reverts the moment it leaves — layered with
      // (not replacing) the random auto-smile beat above.
      const hoveringMouth = mouseOnGrid && mouthZoneMask[mcy * cols + mcx] === 1;
      const mouthOpen = now < smileEndAt || hoveringMouth;

      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const i = cy * cols + cx;
          heat[i] *= 0.93;

          // Near the face/title/subtitle, ignition gets rarer (higher
          // threshold) and dimmer (scaled-down heat) — never fully off, so
          // it still reads as the same ambient field, just quieter there.
          const cool = coolMask[i] || 0;
          const n = hash(cx, cy * 7.13 + noiseFrame * 0.61);
          if (n > 0.988 + cool * 0.011) {
            heat[i] = Math.max(heat[i], (0.2 + n * 0.05) * (1 - cool * 0.6));
          }

          if (mouse.x > -500) {
            const dx = cx - mcx;
            const dy = cy - mcy;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < radius) {
              const boost = 1 - d / radius;
              heat[i] = Math.min(1, heat[i] + boost * boost * 0.55);
            }
            // Local-only flicker inside the eye/hair halo: gated by actual
            // distance to the pointer (not just "is the pointer somewhere in
            // this whole mask"), so it reads as a trail that follows the
            // cursor rather than the entire zone lighting up together.
            if (d < zoneFireRadius && (eyeHaloMask[i] === 1 || hairHaloMask[i] === 1)) {
              const hn = hash(cx * 2.7 + 3.1, cy * 4.1 + t * 0.37);
              if (hn > 0.82) heat[i] = Math.max(heat[i], 0.5 + hn * 0.5);
            }
          }
        }
      }

      const rect = canvas!.getBoundingClientRect();
      ctx!.clearRect(0, 0, rect.width, rect.height);
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          // heat + sparks fill the whole field, only skipping the
          // portrait's ink (repainted solid on top, right below) and
          // whichever HELLO cells are actually showing this frame (per each
          // cell's own continuous fade — empty during "gap", full footprint
          // during "hold", a moving subset while transitioning). Real copy
          // is a separate DOM layer on top of the canvas (z-10) and simply
          // occludes this wherever they overlap.
          const i = cy * cols + cx;
          if (ink[i] || helloOn[i]) continue;
          const v = heat[i];
          const c = colorFor(v);
          if (!c) continue;
          ctx!.fillStyle = c;
          ctx!.fillRect(cx * cell + 1, cy * cell + 1, cell - 2, cell - 2);
        }
      }
      drawPortrait(headDy, bodyPhase, blinking, mouthOpen);

      drawHelloCells(now, noiseFrame);

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
