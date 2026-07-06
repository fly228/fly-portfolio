import { useEffect, useRef } from "react";

/**
 * Cursor-reactive pixel heat grid, modeled on craft.wild.as's hero background.
 *
 * Mechanic: each cell in a coarse grid holds a "heat" value that decays every
 * frame, gets a faint ambient flicker from a drifting noise field, and gets a
 * strong boost when the cursor passes near it. Heat is color-mapped through a
 * discrete cold -> hot palette (navy, blue, gold, red, pale yellow).
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
    let raf = 0;
    let t = 0;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(rect.width / cell);
      rows = Math.ceil(rect.height / cell);
      heat = new Float32Array(cols * rows);
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
          if ((cx + cy) % 11 === 0) {
            ctx!.fillRect(cx * cell + 1, cy * cell + 1, cell - 2, cell - 2);
          }
        }
      }
    }

    function step() {
      t += 1;
      const mcx = Math.floor(mouse.x / cell);
      const mcy = Math.floor(mouse.y / cell);
      const radius = 6;

      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const i = cy * cols + cx;
          heat[i] *= 0.93;

          const ambient =
            (Math.sin(cx * 0.35 + t * 0.02) + Math.cos(cy * 0.4 - t * 0.017)) *
              0.5 +
            0.5;
          if (ambient > 0.965) heat[i] = Math.max(heat[i], 0.22);

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
          const v = heat[cy * cols + cx];
          const c = colorFor(v);
          if (!c) continue;
          ctx!.fillStyle = c;
          ctx!.fillRect(cx * cell + 1, cy * cell + 1, cell - 2, cell - 2);
        }
      }
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
    <section className="relative w-full min-h-[100dvh] bg-paper text-ink overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6 px-6 md:px-12 pt-24 pb-8">
        <h1 className="text-5xl md:text-7xl tracking-tighter leading-none font-semibold">
          FLY WENG,
          <br />
          ENGINEERED.
        </h1>
        <p className="max-w-xs text-sm text-ink/70 md:text-right">
          UI Visual Designer / Presentation Designer / Tech Visual
          Storytelling. 10+ years turning complex briefs into visuals
          executives and clients read instantly.
        </p>
      </div>
      <canvas
        ref={canvasRef}
        className="absolute inset-x-0 bottom-0 top-[220px] md:top-[260px] w-full"
        aria-hidden="true"
      />
    </section>
  );
}
