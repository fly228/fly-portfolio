export type ProjectStatus = "ready" | "pending-assets";

export interface ProjectMedia {
  /** Path under /public, or null to render a 「待圖」placeholder. */
  src: string | null;
  caption: string;
  /** Tailwind aspect class, defaults to aspect-video. */
  aspect?: string;
}

export interface Project {
  slug: string;
  /** Display index, e.g. "01". */
  no: string;
  title: string;
  titleEn: string;
  category: string;
  /** One-line card copy. Keep it under ~30 characters. */
  summary: string;
  status: ProjectStatus;
  cover: string | null;
  /* ---- Case-study page fields ---- */
  client: string;
  role: string;
  focus: string;
  year: string;
  tools: string[];
  /** 2-3 short paragraphs. First paragraph states the problem. */
  intro: string[];
  media: ProjectMedia[];
}

/**
 * Selected work. "pending-assets" keeps a project listed while real design
 * files are still being collected; its case page marks missing blocks 待圖.
 * Fields marked 待補 are unknown facts to be confirmed, not filler.
 */
export const projects: Project[] = [
  {
    slug: "semiconductor-keynote",
    no: "01",
    title: "半導體技術 Keynote",
    titleEn: "Semiconductor Keynote Deck",
    category: "Deck Design",
    summary: "把製程與規格，整理成發表會等級的簡報視覺。",
    status: "ready",
    cover: "/work/semiconductor-keynote/cover.jpg",
    client: "半導體產業客戶",
    role: "簡報視覺統籌",
    focus: "資訊拆解、圖解系統、版面節奏",
    year: "2024",
    tools: ["Keynote", "Figma", "Illustrator"],
    intro: [
      "半導體簡報最常見的問題不是缺資料，是沒有順序。工程團隊給的是規格與數據，台下坐的是主管與客戶，兩邊講的不是同一種語言。",
      "這個案子把技術內容重新拆解：每一頁只講一件事，再用一致的圖解語言把製程、架構與效益畫出來，讓簡報者能照著節奏講完，不用邊講邊解釋圖。",
      "產出是一套可延用的視覺系統：版式、圖表樣式、色彩與圖解元件，之後的場次直接沿用。",
    ],
    media: [
      { src: "/work/semiconductor-keynote/slide-01.jpg", caption: "技術架構頁：一頁一個論點的圖解語言。" },
      { src: "/work/semiconductor-keynote/slide-02.jpg", caption: "製程說明頁：把流程壓成一眼可讀的層級。" },
      { src: null, caption: "版式與圖表元件總覽（待圖）" },
    ],
  },
  {
    slug: "keelung-drone-platform",
    no: "02",
    title: "基隆港務無人機整合平台",
    titleEn: "Keelung Port Drone Platform",
    category: "Platform UI",
    summary: "機隊管理平台的儀表板與資訊層級設計。",
    status: "pending-assets",
    cover: null,
    client: "港務單位",
    role: "UI / 視覺設計",
    focus: "儀表板、狀態系統、資訊層級",
    year: "2021-2023",
    tools: ["Figma"],
    intro: [
      "港區巡檢的無人機平台，操作者要同時掌握機隊狀態、航線與即時影像。值勤畫面不能讓人猶豫，每一個狀態都要有明確的位置。",
      "設計重點在資訊層級：哪些狀態必須一眼看到，哪些收在第二層。用深色介面與嚴格的狀態色規則，建立長時間監看下的閱讀秩序。",
      "產出涵蓋儀表板總覽、任務規劃與警示流程的完整畫面規格。",
    ],
    media: [
      { src: null, caption: "機隊監控儀表板總覽（待圖）" },
      { src: null, caption: "任務規劃流程畫面（待圖）" },
      { src: null, caption: "警示與狀態色系統（待圖）" },
    ],
  },
  {
    slug: "taiwan-blockchain-map",
    no: "03",
    title: "台灣區塊鏈產業地圖",
    titleEn: "Taiwan Blockchain Ecosystem Map",
    category: "Info Design",
    summary: "把整個產業整理成一張可瀏覽的地圖。",
    status: "pending-assets",
    cover: null,
    client: "待補",
    role: "資訊設計 / 視覺設計",
    focus: "資訊架構、分類系統、視覺密度控制",
    year: "2023",
    tools: ["Figma", "Illustrator"],
    intro: [
      "上百個團隊、交易所、媒體與服務商，怎麼放進一張圖而不變成雜訊，是這個案子唯一的問題。",
      "先做分類架構：把產業切成可以互相對照的區塊，再定義每一層的視覺密度，讓讀者能從全貌一路讀到單一團隊，不會在中間迷路。",
      "成品同時作為線上瀏覽與活動輸出物使用。",
    ],
    media: [
      { src: null, caption: "產業地圖全貌（待圖）" },
      { src: null, caption: "分類架構與圖例系統（待圖）" },
    ],
  },
  {
    slug: "kaohsiung-centennial-projection",
    no: "04",
    title: "高雄百年大型投影",
    titleEn: "Kaohsiung Centennial Projection",
    category: "Motion / Style Frames",
    summary: "百年敘事投影的美術方向與動態節奏。",
    status: "ready",
    cover: "/work/kaohsiung-centennial-projection/cover.jpg",
    client: "待補",
    role: "美術指導 / Style Frames",
    focus: "敘事分段、畫面語言、超寬畫幅構圖",
    year: "待補",
    tools: ["After Effects", "Photoshop"],
    intro: [
      "把一百年的城市歷史壓進一場投影，最難的是取捨：哪些事件成為畫面，哪些只是過場。",
      "工作從敘事線開始：先排出章節與情緒節奏，再為每個章節定義畫面語言與轉場邏輯，最後產出供動態團隊執行的 style frames。",
      "投影畫幅是超寬比例，構圖與資訊配置都必須為現場觀看距離重新設計。",
    ],
    media: [
      { src: "/work/kaohsiung-centennial-projection/frame-01.jpg", caption: "投影主視覺 style frame，超寬畫幅。", aspect: "aspect-[3690/1080]" },
      { src: null, caption: "章節分鏡與節奏表（待圖）" },
    ],
  },
  {
    slug: "history-museum-entrance",
    no: "05",
    title: "國立歷史博物館入口形象影片",
    titleEn: "NMH Entrance Film",
    category: "Art Direction",
    summary: "入口大廳形象影片的畫面語言與美術指導。",
    status: "pending-assets",
    cover: null,
    client: "國立歷史博物館",
    role: "美術指導",
    focus: "畫面語言、色彩基調、歷史素材轉譯",
    year: "待補",
    tools: ["After Effects", "Photoshop"],
    intro: [
      "入口影片是觀眾對博物館的第一印象，它要在幾分鐘內把台灣的地理與歷史講成一種氛圍，而不是一堂課。",
      "美術指導的工作是定義畫面語言：用電影感的色彩與構圖轉譯館藏與歷史素材，讓影像有敘事的重量，也保持入口空間需要的安靜。",
      "產出包含全片的色彩基調、關鍵畫面與素材轉譯規則。",
    ],
    media: [
      { src: null, caption: "形象影片關鍵畫面（待圖）" },
      { src: null, caption: "色彩基調與分鏡（待圖）" },
    ],
  },
  {
    slug: "kaohsiung-pier2-5g",
    no: "06",
    title: "高雄駁二 5G 應用活動",
    titleEn: "5G Event, Pier-2 Kaohsiung",
    category: "Event Visual",
    summary: "5G 應用活動與論壇的主視覺與現場輸出。",
    status: "pending-assets",
    cover: null,
    client: "電信與公部門單位",
    role: "活動視覺設計",
    focus: "主視覺、現場輸出、識別延展",
    year: "2021-2023",
    tools: ["Illustrator", "Photoshop"],
    intro: [
      "5G 應用展示活動與論壇，需要一套能同時撐起舞台、展區與宣傳物的主視覺。",
      "視覺從「訊號與場域」出發，延展到現場的大型輸出、指標與論壇畫面，讓分散的展示內容看起來屬於同一場活動。",
      "正式設計稿整理中，圖面補齊後上線。",
    ],
    media: [
      { src: null, caption: "主視覺與延展系統（待圖）" },
      { src: null, caption: "現場輸出與舞台畫面（待圖）" },
    ],
  },
];

export function projectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
