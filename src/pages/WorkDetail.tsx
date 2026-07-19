import { useEffect } from "react";
import { projects, projectBySlug } from "../data/projects";
import type { MediaSpan, ProjectMedia } from "../data/projects";

/**
 * Case-page media grid, after wild.as/work/*: a 12-column grid with mixed
 * block widths (full / 2/3 / half / 1/3) so pages read big–small–big
 * instead of a flat stack. Mobile collapses to a single column.
 */
const SPAN_CLASS: Record<MediaSpan, string> = {
  full: "md:col-span-12",
  wide: "md:col-span-8",
  half: "md:col-span-6",
  third: "md:col-span-4",
};

/** Colour-plan strip: flat vertical bands, like the reference site's palette tile. */
function PaletteBlock({ media }: { media: ProjectMedia }) {
  const swatches = media.swatches ?? [];
  return (
    <figure className="h-full flex flex-col">
      <div className="flex flex-1 min-h-[180px]">
        {swatches.map((hex) => (
          <div
            key={hex}
            className="flex-1 flex items-end justify-center pb-2"
            style={{ backgroundColor: hex }}
          >
            <span
              className="text-[9px] tracking-wide opacity-70 [writing-mode:vertical-rl]"
              style={{ color: isLight(hex) ? "#1b2333" : "#ffffff" }}
            >
              {hex}
            </span>
          </div>
        ))}
      </div>
      {media.caption ? (
        <figcaption className="text-xs text-ink/50 mt-2">{media.caption}</figcaption>
      ) : null}
    </figure>
  );
}

function isLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return r * 0.299 + g * 0.587 + b * 0.114 > 150;
}

function MediaBlock({ media, eager = false }: { media: ProjectMedia; eager?: boolean }) {
  const aspect = media.aspect ?? "aspect-video";
  if (media.type === "palette") return <PaletteBlock media={media} />;
  return (
    <figure className="h-full flex flex-col">
      {media.src ? (
        <img
          src={media.src}
          alt={media.caption ?? ""}
          loading={eager ? "eager" : "lazy"}
          className={`${aspect} w-full object-cover bg-ink/5`}
        />
      ) : (
        <div
          className={`${aspect} w-full flex-1 bg-ink/[0.04] border border-ink/10 flex items-center justify-center`}
        >
          <span className="pixel-notch-sm bg-ink/10 text-ink/50 text-xs px-3 py-1.5 tracking-wide">
            待圖
          </span>
        </div>
      )}
      {media.caption ? (
        <figcaption className="text-xs text-ink/50 mt-2">{media.caption}</figcaption>
      ) : null}
    </figure>
  );
}

/**
 * Case-study page, structured after wild.as/work/* :
 * index + title, hero media, intro paragraphs beside a credits column,
 * stacked media with captions, then prev/next project navigation.
 */
export function WorkDetail({ slug }: { slug: string }) {
  const project = projectBySlug(slug);

  useEffect(() => {
    if (project) document.title = `${project.title} | Fly Weng`;
    return () => {
      document.title = "Fly Weng | UI Visual Designer";
    };
  }, [project]);

  if (!project) {
    return (
      <section className="px-6 md:px-12 py-24 text-ink min-h-[60dvh]">
        <p className="text-ink/60 mb-6">找不到這個案例。</p>
        <a href="#/" data-cursor="hover" className="underline underline-offset-4">
          回作品列表
        </a>
      </section>
    );
  }

  const idx = projects.findIndex((p) => p.slug === project.slug);
  const prev = projects[(idx - 1 + projects.length) % projects.length];
  const next = projects[(idx + 1) % projects.length];

  const credits: [string, string][] = [
    ["客戶", project.client],
    ["角色", project.role],
    ["重點", project.focus],
    ["年份", project.year],
    ["工具", project.tools.join(" / ")],
  ];

  return (
    <article className="text-ink">
      {/* Top bar: back home + index */}
      <div className="flex items-center justify-between px-6 md:px-12 pt-6 pb-16">
        <a href="#/" data-cursor="hover" className="text-sm font-medium tracking-wide">
          ← Fly Weng
        </a>
        <span className="text-sm text-ink/40">W / {project.no}</span>
      </div>

      <header className="px-6 md:px-12 mb-12">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-normal leading-tight max-w-4xl">
          {project.title}
        </h1>
        <p className="text-sm text-ink/50 mt-3">{project.titleEn}</p>
      </header>

      {/* Hero media */}
      <div className="px-6 md:px-12 mb-16">
        {project.cover ? (
          <img
            src={project.cover}
            alt={project.titleEn}
            className="w-full aspect-video object-cover bg-ink/5"
          />
        ) : (
          <div className="w-full aspect-video bg-ink/[0.04] border border-ink/10 flex items-center justify-center">
            <span className="pixel-notch-sm bg-ink/10 text-ink/50 text-xs px-3 py-1.5 tracking-wide">
              待圖
            </span>
          </div>
        )}
      </div>

      {/* Intro + credits */}
      <div className="px-6 md:px-12 mb-20 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-12 md:gap-20">
        <div className="space-y-5 max-w-[62ch]">
          {project.intro.map((paragraph) => (
            <p key={paragraph} className="text-ink/75 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
        <dl className="self-start divide-y divide-ink/10 border-t border-ink/10">
          {credits.map(([label, value]) => (
            <div key={label} className="py-3">
              <dt className="text-xs text-ink/40 mb-0.5">{label}</dt>
              <dd className="text-sm text-ink/80">{value}</dd>
            </div>
          ))}
          {project.videoUrl ? (
            <div className="py-3">
              <dt className="text-xs text-ink/40 mb-0.5">影片</dt>
              <dd className="text-sm">
                <a
                  href={project.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="hover"
                  className="underline underline-offset-4 text-ink/80 hover:text-ink"
                >
                  觀看完整影片 ↗
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      {/* Media grid: 12 columns, mixed spans, tight gutters like the reference */}
      <div className="px-6 md:px-12 mb-24 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
        {project.media.map((m, i) => (
          <div key={`${m.src ?? m.caption ?? "block"}-${i}`} className={SPAN_CLASS[m.span ?? "full"]}>
            <MediaBlock media={m} eager={i === 0} />
          </div>
        ))}
      </div>

      {/* Prev / next */}
      <nav className="border-t border-ink/10 grid grid-cols-2" aria-label="其他案例">
        <a
          href={`#/work/${prev.slug}`}
          data-cursor="hover"
          className="px-6 md:px-12 py-10 border-r border-ink/10 group"
        >
          <p className="text-xs text-ink/40 mb-1">← 上一件</p>
          <p className="text-sm md:text-base font-medium leading-snug group-hover:underline underline-offset-4">
            {prev.title}
          </p>
        </a>
        <a
          href={`#/work/${next.slug}`}
          data-cursor="hover"
          className="px-6 md:px-12 py-10 text-right group"
        >
          <p className="text-xs text-ink/40 mb-1">下一件 →</p>
          <p className="text-sm md:text-base font-medium leading-snug group-hover:underline underline-offset-4">
            {next.title}
          </p>
        </a>
      </nav>
    </article>
  );
}
