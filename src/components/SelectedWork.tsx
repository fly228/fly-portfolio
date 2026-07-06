import { projects } from "../data/projects";

export function SelectedWork() {
  return (
    <section className="px-6 md:px-12 py-24 bg-paper text-ink">
      <h2 className="text-3xl md:text-4xl tracking-tight max-w-2xl mb-12">
        Selected work
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((p) => (
          <article
            key={p.slug}
            className="group relative border border-ink/10 rounded-none overflow-hidden"
          >
            <div className="aspect-[4/3] bg-ink/5 flex items-center justify-center relative">
              {p.cover ? (
                <img
                  src={p.cover}
                  alt={p.titleEn}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-ink/40 px-4 text-center">
                  {p.status === "pending-assets"
                    ? "Placeholder — real design assets pending"
                    : "Placeholder — cover image pending"}
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
    </section>
  );
}
