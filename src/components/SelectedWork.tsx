import { useRef } from "react";
import { projects } from "../data/projects";
import { IconButton } from "./Button";
import { PixelEdgeHover } from "./PixelEdgeHover";

/**
 * Horizontal work track. Prev/next buttons float on the track's left and
 * right edges, vertically centered on the cards (craft.wild.as places them
 * on the track, not in the heading row).
 */
export function SelectedWork() {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByCard(dir: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("a");
    const cardWidth = card ? card.getBoundingClientRect().width + 24 : 380;
    track.scrollBy({ left: dir * cardWidth, behavior: "smooth" });
  }

  return (
    <section id="work" className="py-24 text-ink">
      <div className="px-6 md:px-12 mb-10">
        <h2 className="text-3xl md:text-4xl tracking-normal">Selected work</h2>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar px-6 md:px-12"
        >
          {projects.map((p) => (
            <a
              key={p.slug}
              href={`#/work/${p.slug}`}
              className="group block snap-start shrink-0 w-[82%] sm:w-[60%] md:w-[38%] lg:w-[30%]"
              data-cursor="hover"
              aria-label={`${p.title}，查看案例`}
            >
              <div className="aspect-[4/3] bg-ink/5 relative overflow-hidden">
                {p.cover ? (
                  <>
                    <img
                      src={p.cover}
                      alt={p.titleEn}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <PixelEdgeHover src={p.cover} />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-ink/40">待圖</span>
                  </div>
                )}
                {p.status === "pending-assets" && (
                  <span className="pixel-notch-sm absolute top-2 left-2 text-[10px] bg-ink text-paper px-2 py-1 tracking-wide">
                    素材整理中
                  </span>
                )}
                <div className="cta-slide z-10 flex items-end justify-center">
                  <span className="text-paper text-sm tracking-wide pb-3 flex items-center gap-2">
                    查看案例 <span aria-hidden="true">↗</span>
                  </span>
                </div>
              </div>
              <div className="pt-4">
                <h3 className="text-base font-medium leading-snug tracking-normal">
                  {p.title}
                </h3>
                <p className="text-sm text-ink/60 leading-relaxed mt-1">{p.summary}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Track-edge navigation, desktop only; touch devices swipe. */}
        <div className="hidden md:block">
          <div className="absolute left-4 top-[38%] -translate-y-1/2 z-10">
            <IconButton direction="left" label="上一件作品" onClick={() => scrollByCard(-1)} />
          </div>
          <div className="absolute right-4 top-[38%] -translate-y-1/2 z-10">
            <IconButton direction="right" label="下一件作品" onClick={() => scrollByCard(1)} />
          </div>
        </div>
      </div>
    </section>
  );
}
