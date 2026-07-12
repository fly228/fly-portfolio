import { skillCategories } from "../data/experience";
import { PixelFlow } from "./PixelFlow";

export function About() {
  return (
    <section className="px-6 md:px-12 py-24 text-ink border-t border-ink/10">
      <div className="max-w-2xl mb-12">
        <h2 className="text-3xl md:text-4xl tracking-normal mb-4 leading-snug">
          三種媒材，
          <br className="md:hidden" />
          同一套方法。
        </h2>
        <p className="text-ink/70 leading-relaxed">
          簡報、介面、動態影像。媒材一直在換，工作方法沒變：先把資訊拆開，排出順序，再決定畫面長什麼樣子。
        </p>
      </div>

      <div className="mb-10 -mx-6 md:-mx-12 px-6 md:px-12 overflow-x-auto no-scrollbar">
        <PixelFlow />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {skillCategories.map((s) => (
          <div key={s.number}>
            <div className="flex items-center gap-2 mb-2">
              <span className="pixel-notch-sm bg-ink text-paper text-[11px] w-6 h-6 flex items-center justify-center shrink-0">
                {s.number}
              </span>
              <p className="font-medium">{s.title}</p>
            </div>
            <p className="text-sm text-ink/60 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
