import { skillCategories } from "../data/experience";
import { PixelFlow } from "./PixelFlow";

export function About() {
  return (
    <section className="px-6 md:px-12 py-24 text-ink border-t border-ink/10">
      <div className="max-w-2xl mb-12">
        <h2 className="text-3xl md:text-4xl tracking-normal mb-4">About</h2>
        <p className="text-ink/70 leading-relaxed text-justify">
          10+ 年視覺、動態影像與科技簡報設計經驗，曾與政府、電信、港務單位與大型活動合作，專長是把複雜資訊拆解成清楚的視覺順序。
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
