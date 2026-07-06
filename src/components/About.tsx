import { skillGroups } from "../data/experience";

export function About() {
  return (
    <section className="px-6 md:px-12 py-24 bg-ink text-paper">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-3xl md:text-4xl tracking-tight mb-6">About</h2>
          <p className="text-paper/70 leading-relaxed max-w-[60ch]">
            具 10+ 年視覺、動態影像與科技簡報設計經驗，轉化為高階主管、客戶提案與大型活動可快速理解的視覺敘事。熟悉從資訊架構、版面系統、動態節奏到交付製作的完整流程，能在高壓時程中維持品質與品牌一致性。曾與政府、電信、港務單位與大型活動合作。
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {skillGroups.map((g) => (
            <div key={g.title}>
              <h3 className="text-sm text-paper/50 mb-3">{g.title}</h3>
              <ul className="space-y-1">
                {g.items.map((item) => (
                  <li key={item} className="text-sm text-paper/85">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
