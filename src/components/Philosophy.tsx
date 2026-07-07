export function Philosophy() {
  return (
    <section className="px-6 md:px-12 py-28 text-ink">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
        <div>
          <h2 className="text-3xl md:text-5xl tracking-normal leading-snug">
            視覺是溝通的捷徑,
            <br />
            不是裝飾。
          </h2>
          <p className="text-xs uppercase tracking-wider text-ink/40 mt-4">
            核心觀點
          </p>
        </div>
        <div className="space-y-6 text-ink/70 leading-relaxed max-w-[55ch] text-justify">
          <p>
            主管沒有時間看完整份提案,客戶也沒有耐心拆解複雜的技術文件。多數專案真正卡住的地方不是缺素材,是資訊沒有被整理成看得懂的順序。
          </p>
          <p>
            這十年多半在做同一件事:把工程規格、政府文件、活動需求,轉成一張投影片、一支動態、一個介面就能講清楚的樣子。
          </p>
          <p className="text-ink/40 text-sm">
            素材會換、格式會換,但把資訊拆解成清楚順序這件事,十年來沒變過。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 pt-6 border-t border-ink/10">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink/40 mb-2">
                擅長
              </p>
              <p className="text-sm text-ink/70">
                把複雜資訊拆解成一眼看懂的畫面與節奏。
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-ink/40 mb-2">
                不做
              </p>
              <p className="text-sm text-ink/70">
                沒有溝通目的、純裝飾性的美術創作。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
