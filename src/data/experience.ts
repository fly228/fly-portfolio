export interface Job {
  company: string;
  role: string;
  period: string;
  tag: string;
  bullets: string[];
}

export const experience: Job[] = [
  {
    company: "Jingmi Lab",
    role: "Visual Designer",
    period: "2024.01 - now",
    tag: "Deck / UI",
    bullets: [
      "轉化為適合主管簡報、客戶溝通與發表會使用的視覺系統。",
      "支援活動攝影與輸出製作，與線上 UI/UX 的視覺產出。",
    ],
  },
  {
    company: "加密實驗股份有限公司",
    role: "Visual Designer",
    period: "2023.04 - 2023.10",
    tag: "Brand",
    bullets: [
      "製作品牌溝通素材、主管/客戶向視覺文件、短影音、EDM 與活動印刷物。",
      "支援活動攝影與輸出製作，能從線上內容延伸到實體活動接觸點。",
    ],
  },
  {
    company: "中華系統整合",
    role: "Visual Designer & Project Manager",
    period: "2021.07 - 2023.04",
    tag: "Deck / PM",
    bullets: [
      "將技術提案與政府/企業需求轉換為高階簡報、提案視覺與客戶溝通素材。",
      "統籌動態影像、網站、EDM、展覽與活動設計時程，協調專案交付。",
    ],
  },
  {
    company: "蝦米智慧",
    role: "Motion & Visual Designer",
    period: "2019.12 - 2021.07",
    tag: "Motion",
    bullets: [
      "為品牌與科技客戶製作動態圖像、影片剪輯與視覺素材。",
      "建立並標準化後期製作流程，協助 junior designer 熟悉 motion/compositing pipeline。",
    ],
  },
  {
    company: "夢想動畫",
    role: "Designer & Motion Compositor",
    period: "2016.04 - 2019.10",
    tag: "Motion",
    bullets: [
      "參與 ASUS、Garena、ROG、Lays 等商業專案，負責 layout、style frame、storyboard、合成與 motion。",
    ],
  },
  {
    company: "澳德設計",
    role: "Motion & Compositing Artist",
    period: "2012.11 - 2015.10",
    tag: "Motion",
    bullets: ["負責動態影像、合成、專案規劃與視覺素材交付，累積廣告與活動製作的基礎能力。"],
  },
];

export const skillCategories = [
  {
    number: "01",
    title: "簡報敘事",
    desc: "把技術規格與提案轉成主管、客戶看得懂的投影片節奏。",
  },
  {
    number: "02",
    title: "UI 資訊架構",
    desc: "用 Figma 建立畫面秩序與資訊層級，降低理解成本。",
  },
  {
    number: "03",
    title: "影像與動態",
    desc: "After Effects、Blender 等工具產出完整動態與合成畫面。",
  },
  {
    number: "04",
    title: "跨部門協作",
    desc: "對接主管、客戶與工程需求，統籌交付時程。",
  },
];
