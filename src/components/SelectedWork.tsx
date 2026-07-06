import { useRef } from "react";
import { projects } from "../data/projects";
import { IconButton } from "./Button";

export function SelectedWork() {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByCard(dir: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("article");
    const cardWidth = card ? card.getBoundingClientRect().width + 24 : 380;
    track.scrollBy({ left: dir * cardWidth, behavior: "smooth" });
  }

  return (
    <section className="px-6 md:px-12 py-24 bg-paper text-ink">
      <div className="flex items-end justify-between mb-10">
        <h2 className="text-3xl md:text-4xl tracking-tight">Selected work</h2>
        <div className="hidden md:flex gap-3">
          <IconButton direction="left" label="Previous project" onClick={() => scrollByCard(-1)} />
          <IconButton direction="right" label="Next project" onClick={() => scrollByCard(1)} />
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-6 px-6 md:-mx-12 md:px-12"
      >
        {projects.map((p) => (
          <article
            key={p.slug}
            className="group relative border border-ink/10 overflow-hidden snap-start shrink-0 w-[82%] sm:w-[60%] md:w-[38%] lg:w-[30%]"
            data-cursor="hover"
          >
            <div className="aspect-[4/3] bg-ink/5 flex items-center justify-center relative overflow-hidden">
              {p.cover ? (
                <img
                  src={p.cover}
                  alt={p.titleEn}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="text-xs text-ink/40 px-4 text-center">
                  Placeholder, cover pending
                </span>
              )}
              {p.status === "pending-assets" && (
                <span className="absolute top-2 left-2 text-[10px] bg-ink text-paper px-2 py-1">
                  assets pending
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="text-xs text-ink/50 mb-1">{p.category}</p>
              <h3 className="text-base font-medium leading-snug mb-1">
                {p.title}
              </h3>
              <p className="text-sm text-ink/60">{p.summary}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="flex md:hidden gap-3 mt-6">
        <IconButton direction="left" label="Previous project" onClick={() => scrollByCard(-1)} />
        <IconButton direction="right" label="Next project" onClick={() => scrollByCard(1)} />
      </div>
    </section>
  );
}
