export type ProjectStatus = "ready" | "pending-assets";

export interface Project {
  slug: string;
  title: string;
  titleEn: string;
  category: string;
  summary: string;
  status: ProjectStatus;
  /** Set to a real path under /public/work/<slug>/ once real assets exist. */
  cover: string | null;
}

/**
 * Selected work. Status "pending-assets" renders with a placeholder cover
 * and a small "assets pending" tag instead of being deleted outright, so
 * nothing is silently dropped from the record while real files are missing.
 *
 * To remove or reorder a project for real: edit this file and redeploy
 * (or tell Claude which slug to change/remove/reorder next time).
 */
export const projects: Project[] = [
  {
    slug: "semiconductor-keynote",
    title: "晶片 / 半導體技術 Keynote 簡報",
    titleEn: "Semiconductor Keynote Deck",
    category: "Deck Design",
    summary:
      "轉化為適合主管簡報、客戶溝通與發表會使用的視覺系統。",
    status: "ready",
    cover: "/work/semiconductor-keynote/cover.jpg",
  },
  {
    slug: "kaohsiung-pier2-5g",
    title: "高雄駁二 5G 應用活動與論壇",
    titleEn: "5G Technology Event, Pier-2 Kaohsiung",
    category: "Event UI",
    summary:
      "目前只有活動現場照片，正式設計稿數量不足，暫列為待補案例。這張圖是活動現場照片暫代，非正式設計稿。",
    status: "pending-assets",
    cover: "/work/kaohsiung-pier2-5g/cover.jpg",
  },
  {
    slug: "keelung-drone-platform",
    title: "基隆港務無人機整合平台",
    titleEn: "Keelung Port Drone Platform UI",
    category: "Platform UI",
    summary:
      "無人機機隊管理與監控平台的 UX / 視覺系統，含狀態儀表板與資訊層級設計。",
    status: "ready",
    cover: "/work/keelung-drone-platform/cover.jpg",
  },
  {
    slug: "kaohsiung-centennial-projection",
    title: "高雄百年大型投影",
    titleEn: "Kaohsiung Centennial Projection Mapping",
    category: "Motion / Style Frames",
    summary: "大型投影敘事的美術方向與 style frame，規劃歷史故事線與動態節奏。",
    status: "ready",
    cover: "/work/kaohsiung-centennial-projection/cover.jpg",
  },
  {
    slug: "history-museum-entrance",
    title: "國立歷史博物館入口形象影片",
    titleEn: "National Museum of History Entrance Film",
    category: "Art Direction",
    summary: "入口大廳形象影片的主視覺美術指導，電影感畫面語言呈現台灣地理與歷史。",
    status: "ready",
    cover: "/work/history-museum-entrance/cover.jpg",
  },
  {
    slug: "taiwan-blockchain-map",
    title: "台灣區塊鏈產業地圖",
    titleEn: "Taiwan Blockchain Ecosystem Info Design",
    category: "Info Design",
    summary: "台灣區塊鏈產業與金融科技資訊轉化為可瀏覽、可理解的 UI 式資訊設計。",
    status: "ready",
    cover: "/work/taiwan-blockchain-map/cover.jpg",
  },
];
