export type ProjectStatus = "ready" | "pending-assets";

/**
 * Grid width of a media block, on the case page's 12-column grid
 * (mobile always stacks to a single column):
 * - "full"  = 12 cols
 * - "wide"  = 8 cols (2/3)
 * - "half"  = 6 cols
 * - "third" = 4 cols (1/3)
 * Defaults to "full" so legacy entries keep working.
 */
export type MediaSpan = "full" | "wide" | "half" | "third";

export interface ProjectMedia {
  /**
   * "palette" renders a colour-plan strip instead of an image.
   * "heading" renders a full-width section divider — used on multi-case
   * pages that bundle several clients under one project (e.g. a yearly
   * round-up) so each case gets its own labelled block within the grid.
   */
  type?: "image" | "palette" | "heading";
  /** Path under /public, or null to render a 「待圖」placeholder. */
  src?: string | null;
  /** Colour-plan swatches, hex strings, for type "palette". */
  swatches?: string[];
  /** For type "heading": small eyebrow line above the label. */
  label?: string;
  /** For type "heading": the section title itself. */
  heading?: string;
  /** Optional; rendered only when non-empty. */
  caption?: string;
  span?: MediaSpan;
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
  /** Optional external link to the finished film. */
  videoUrl?: string;
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
      // 滿寬開場:亮藍章節視覺(封面已用 MM1,內文不重複)
      { src: "/work/semiconductor-keynote/img-05.jpg", span: "full", caption: "章節主視覺:亮藍與淺灰的對比節奏。" },
      // 半 + 半:同一組深藍敘事頁
      { src: "/work/semiconductor-keynote/img-02.jpg", span: "half" },
      { src: "/work/semiconductor-keynote/img-03.jpg", span: "half" },
      // 2/3 市場數據 + 1/3 色彩計畫
      { src: "/work/semiconductor-keynote/img-04.jpg", span: "wide", caption: "市場數據頁:預測區間壓成一眼可讀的圖表層級。" },
      {
        type: "palette",
        span: "third",
        caption: "色彩計畫:深夜藍到紙白的六階系統。",
        swatches: ["#020a3b", "#08318b", "#1a62fd", "#5d8cb6", "#8fb4f5", "#edf0f1"],
      },
      // 半 + 半:產品線與成長趨勢
      { src: "/work/semiconductor-keynote/img-06.jpg", span: "half" },
      { src: "/work/semiconductor-keynote/img-07.jpg", span: "half", caption: "成長趨勢頁:三條市場曲線共用同一套圖表語言。" },
      // 2/3 公司介紹拼貼 + 1/3 投資亮點直式裁切
      { src: "/work/semiconductor-keynote/img-08.jpg", span: "wide", caption: "公司介紹頁:照片拼貼與資訊標籤的組合。" },
      { src: "/work/semiconductor-keynote/img-09.jpg", span: "third", aspect: "aspect-[4/5]", caption: "投資亮點:數字做成畫面的主角。" },
      // 半 + 半:威脅情境與產品特性
      { src: "/work/semiconductor-keynote/img-12.jpg", span: "half", caption: "威脅情境頁:四種風險共用同一套圖示語言。" },
      { src: "/work/semiconductor-keynote/img-11.jpg", span: "half", caption: "產品特性頁:三個賣點對應三種防護。" },
      // 滿寬收尾:淺色系統總覽
      { src: "/work/semiconductor-keynote/img-10.jpg", span: "full", caption: "版面系統總覽:格線、層級與圖解元件的共同語言。" },
    ],
  },
  {
    slug: "keelung-drone-platform",
    no: "02",
    title: "基隆港務無人機整合平台",
    titleEn: "Keelung Port Drone Platform",
    category: "Platform UI",
    summary: "機隊管理平台的儀表板與資訊層級設計。",
    status: "ready",
    cover: "/work/keelung-drone-platform/cover.jpg",
    client: "港務單位",
    role: "UI / 視覺設計",
    focus: "地圖介面、巡檢流程、狀態與告警",
    year: "2021-2023",
    tools: ["Figma"],
    intro: [
      "港區巡檢的無人機平台，操作者要同時掌握航線、計劃與即時偵測結果。值勤畫面不能讓人猶豫，每一個狀態都要有明確的位置。",
      "設計重點在資訊層級：地圖是主角，紀錄、計劃與告警收進固定的框架，用嚴格的狀態色規則建立長時間監看下的閱讀秩序。",
      "產出涵蓋監管總覽、巡檢紀錄、偵測報告與告警通知的完整畫面。",
    ],
    media: [
      // 滿寬:UTM 監管總覽
      { src: "/work/keelung-drone-platform/img-01.jpg", span: "full", aspect: "aspect-[1440/1024]", caption: "UTM 智慧監管總覽:地圖是主角,計劃收進側欄。" },
      // 半 + 半:巡檢地圖與計劃管理
      { src: "/work/keelung-drone-platform/img-02.jpg", span: "half", aspect: "aspect-[1440/1024]" },
      { src: "/work/keelung-drone-platform/img-03.jpg", span: "half", aspect: "aspect-[1440/1024]", caption: "計劃管理:狀態色一眼分辨執行進度。" },
      // 2/3 偵測報告 + 1/3 色彩計畫
      { src: "/work/keelung-drone-platform/img-04.jpg", span: "wide", aspect: "aspect-[1440/1024]", caption: "偵測報告:航拍影像對上海圖座標。" },
      {
        type: "palette",
        span: "third",
        caption: "色彩計畫:海圖為底的六階——深夜藍、海灣墨、山色綠、霧灰藍、介面淺灰,告警紅點睛。",
        swatches: ["#081828", "#223436", "#424d48", "#98a2ad", "#e1e3e6", "#f85858"],
      },
      // 半 + 半:紀錄列表與下載流程
      { src: "/work/keelung-drone-platform/img-05.jpg", span: "half", aspect: "aspect-[1440/1024]" },
      { src: "/work/keelung-drone-platform/img-06.jpg", span: "half", aspect: "aspect-[1440/1024]", caption: "報告下載:動作收進選單,畫面保持安靜。" },
      // 2/3 空狀態 + 1/3 告警信直式
      { src: "/work/keelung-drone-platform/img-07.jpg", span: "wide", aspect: "aspect-[1440/1024]", caption: "401 空狀態:守規矩的介面也要有表情。" },
      { src: "/work/keelung-drone-platform/img-08.jpg", span: "third", aspect: "aspect-[600/780]", caption: "告警通知信:異常即時推送到信箱。" },
      // 滿寬收尾:計劃內容檢視
      { src: "/work/keelung-drone-platform/img-09.jpg", span: "full", aspect: "aspect-[1440/1024]", caption: "計劃內容:航區多邊形與網格直接畫在海圖上。" },
    ],
  },
  {
    slug: "history-museum-entrance",
    no: "03",
    title: "國立歷史博物館入口形象影片",
    titleEn: "NMH Entrance Film",
    category: "Motion / Style Frames",
    summary: "入口形象影片的台灣百年敘事畫面。",
    status: "ready",
    cover: "/work/history-museum-entrance/cover.jpg",
    client: "國立歷史博物館",
    role: "美術指導 / Style Frames",
    focus: "敘事分段、時代畫面語言、超寬畫幅構圖",
    year: "2019",
    tools: ["After Effects", "Photoshop"],
    intro: [
      "入口影片是觀眾對博物館的第一印象：要把台灣一百年的故事壓進一條超寬畫幅，最難的是取捨——哪些時代成為畫面，哪些只是過場。",
      "工作從敘事線開始：山海、群像、田野、廟埕、宴席，一路走到城市煙火與海洋終章。每個章節有自己的色彩與材質——泛黃紙感、老照片、廟埕紅、神光青——再產出供動態團隊執行的 style frames。",
      "投影畫幅是 3690×1080 的超寬比例，構圖與文字配置都為現場觀看距離重新設計。",
    ],
    media: [
      // 滿寬超寬畫幅:世代群像開場
      { src: "/work/history-museum-entrance/img-01.jpg", span: "full", aspect: "aspect-[3690/1080]", caption: "世代群像:老照片拼貼站上水平線。" },
      // 半 + 半:自然章節
      { src: "/work/history-museum-entrance/img-02.jpg", span: "half" },
      { src: "/work/history-museum-entrance/img-03.jpg", span: "half", caption: "田野與聚落:稻香章節的青綠基調。" },
      // 2/3 時代舞台 + 1/3 色彩計畫
      { src: "/work/history-museum-entrance/img-07.jpg", span: "wide", aspect: "aspect-[2/1]", caption: "時代舞台:黑白紀錄影像與旗幟的年代感。" },
      {
        type: "palette",
        span: "third",
        caption: "色彩計畫:跟著百年敘事走的六階——紙金、照片褐、田野綠、廟埕紅、深海夜、神光青。",
        swatches: ["#d2c296", "#9b816e", "#2d5c49", "#d06060", "#12333d", "#5fa8b8"],
      },
      // 滿寬:廟埕戲台
      { src: "/work/history-museum-entrance/img-04.jpg", span: "full", aspect: "aspect-[3690/1080]", caption: "廟埕戲台:紅色樑柱框住黑白記憶。" },
      // 半 + 半:火車與宴席
      { src: "/work/history-museum-entrance/img-05.jpg", span: "half" },
      { src: "/work/history-museum-entrance/img-06.jpg", span: "half", caption: "寶島大樂團:宴席拱門的金紅節奏。" },
      // 2/3 藍色終章 + 1/3 城市煙火直式
      { src: "/work/history-museum-entrance/img-09.jpg", span: "wide", aspect: "aspect-[2/1]", caption: "終章開場:神光青的山海與霓虹字框。" },
      { src: "/work/history-museum-entrance/img-10.jpg", span: "third", aspect: "aspect-[4/5]", caption: "城市之夜:數位煙火與天際線。" },
      // 滿寬收尾:鯨魚終章
      { src: "/work/history-museum-entrance/img-08.jpg", span: "full", aspect: "aspect-[3690/1080]", caption: "海洋終章:鯨魚游過斯土斯民的夜海。" },
    ],
  },
  {
    slug: "kaohsiung-pier2-5g",
    no: "04",
    title: "高雄駁二 5G 應用活動",
    titleEn: "5G Event, Pier-2 Kaohsiung",
    category: "Event Visual",
    summary: "5G 應用活動與論壇的主視覺與現場輸出。",
    status: "ready",
    cover: "/work/kaohsiung-pier2-5g/cover.jpg",
    client: "電信與公部門單位",
    role: "活動視覺設計",
    focus: "主視覺、舞台與展區輸出、數位塗鴉互動",
    year: "2021-2023",
    tools: ["Illustrator", "Photoshop"],
    intro: [
      "5G 應用展示活動與論壇，需要一套能同時撐起舞台、展區與互動裝置的視覺。",
      "視覺從「訊號與場域」出發：論壇舞台、展區輸出，一路延展到 5G Graffiti 數位塗鴉牆——連噴罐都是訂製的視覺物件，讓分散的展示內容屬於同一場活動。",
      "白天是論壇與展區，晚上塗鴉牆亮起來變成街區的霓虹現場。",
    ],
    media: [
      // 滿寬:論壇舞台
      { src: "/work/kaohsiung-pier2-5g/img-01.jpg", span: "full", aspect: "aspect-[21/9]", caption: "亞灣 5G AIoT 趨勢論壇:主視覺撐起整面舞台。" },
      // 半 + 半:主持與展區
      { src: "/work/kaohsiung-pier2-5g/img-02.jpg", span: "half", aspect: "aspect-[3/2]" },
      { src: "/work/kaohsiung-pier2-5g/img-03.jpg", span: "half", aspect: "aspect-[3/2]", caption: "展區:識別色塊延展到攤位與指標。" },
      // 2/3 論壇全場 + 1/3 色彩計畫
      { src: "/work/kaohsiung-pier2-5g/img-04.jpg", span: "wide", aspect: "aspect-[2/1]", caption: "論壇全場:視覺在場館尺度下仍然成立。" },
      {
        type: "palette",
        span: "third",
        caption: "色彩計畫:深夜紫到展場白,塗鴉青與火花紅是活動的聲量。",
        swatches: ["#201070", "#4040d0", "#30f0f0", "#60f0b0", "#f04030", "#ececec"],
      },
      // 滿寬:數位塗鴉牆
      { src: "/work/kaohsiung-pier2-5g/img-05.jpg", span: "full", aspect: "aspect-[21/9]", caption: "5G Graffiti 數位塗鴉牆:LED 牆面即時噴繪。" },
      // 半 + 半:現場創作與訂製噴罐
      { src: "/work/kaohsiung-pier2-5g/img-06.jpg", span: "half", aspect: "aspect-[3/2]" },
      { src: "/work/kaohsiung-pier2-5g/img-07.jpg", span: "half", aspect: "aspect-[3/2]", caption: "訂製噴罐:互動道具也做成視覺物件。" },
      // 2/3 大合照 + 1/3 噴罐直式
      { src: "/work/kaohsiung-pier2-5g/img-08.jpg", span: "wide", aspect: "aspect-[2/1]", caption: "數位塗鴉牆前的大合照。" },
      { src: "/work/kaohsiung-pier2-5g/img-09.jpg", span: "third", aspect: "aspect-[4/5]", caption: "噴罐與 LED 牆:互動的第一視角。" },
      // 半 + 半:街區延展
      { src: "/work/kaohsiung-pier2-5g/img-10.jpg", span: "half", aspect: "aspect-[3/2]" },
      { src: "/work/kaohsiung-pier2-5g/img-11.jpg", span: "half", aspect: "aspect-[3/2]", caption: "5G GRAFFITI 光雕:視覺打上街區牆面。" },
      // 滿寬收尾:夜場
      { src: "/work/kaohsiung-pier2-5g/img-12.jpg", span: "full", aspect: "aspect-[21/9]", caption: "夜場:塗鴉牆亮起,活動變成街區的霓虹現場。" },
    ],
  },
  {
    slug: "acer-ifa-opening",
    no: "05",
    title: "Acer IFA 發表會開場影片",
    titleEn: "Acer IFA Opening Film",
    category: "Motion / Opening Film",
    summary: "next@acer 發表會的開場動態與光線語言。",
    status: "ready",
    cover: "/work/acer-ifa-opening/cover.jpg",
    client: "Acer",
    role: "動態視覺 / Style Frames",
    focus: "光線語言、節奏分段、品牌幾何轉譯",
    year: "2019",
    tools: ["After Effects", "Illustrator"],
    intro: [
      "發表會開場影片只有一個任務：在燈暗下來的幾十秒裡，把全場的注意力收攏到舞台上。",
      "視覺從品牌的幾何出發——三角、箭羽與 X——用黑場上的光線把它們一筆一筆畫出來，從 minimize 的收斂走向 MAXIMIZE 的張開，節奏跟著音軌逐步推高。",
      "產出是全片的 style frames 與動態規則：光線的粗細、速度與色彩，最後收在 next@acer 的開場標版。",
    ],
    media: [
      // 滿寬:MAXIMIZE 線框開場
      { src: "/work/acer-ifa-opening/img-01.jpg", span: "full", caption: "開場:點陣與線框中浮出 MAXIMIZE。" },
      // 半 + 半:minimize 色塊與音軌波形
      { src: "/work/acer-ifa-opening/img-02.jpg", span: "half" },
      { src: "/work/acer-ifa-opening/img-03.jpg", span: "half", caption: "音軌波形:節奏是整支片的骨架。" },
      // 2/3 玻璃磚陣列 + 1/3 色彩計畫
      { src: "/work/acer-ifa-opening/img-04.jpg", span: "wide", caption: "玻璃磚陣列:產品線的抽象隊形。" },
      {
        type: "palette",
        span: "third",
        caption: "色彩計畫:墨黑到螢光綠的六階,黑場之上只留光。",
        swatches: ["#05080a", "#0d2436", "#105090", "#008070", "#20e0f0", "#30e030"],
      },
      // 滿寬:綠色 X
      { src: "/work/acer-ifa-opening/img-05.jpg", span: "full", aspect: "aspect-[21/9]", caption: "X 章節:雙色光軸交會的最高點。" },
      // 半 + 半:三角幾何
      { src: "/work/acer-ifa-opening/img-06.jpg", span: "half" },
      { src: "/work/acer-ifa-opening/img-07.jpg", span: "half", caption: "懸浮稜錐:品牌三角的自由隊形。" },
      // 2/3 速度線 + 1/3 光束直式
      { src: "/work/acer-ifa-opening/img-08.jpg", span: "wide", aspect: "aspect-[2/1]", caption: "速度章節:水平光線拉出加速度。" },
      { src: "/work/acer-ifa-opening/img-09.jpg", span: "third", aspect: "aspect-[4/5]", caption: "光束與鏡頭光斑的過場。" },
      // 半 + 半:光錐與 V 型
      { src: "/work/acer-ifa-opening/img-10.jpg", span: "half" },
      { src: "/work/acer-ifa-opening/img-11.jpg", span: "half", caption: "V 型光幕:綠光收攏成箭羽。" },
      // 滿寬:MAXIMIZE 終幕
      { src: "/work/acer-ifa-opening/img-12.jpg", span: "full", caption: "終幕組合:MAXIMIZE 與資訊框的完整畫面。" },
      // 半 + 半:標版收尾
      { src: "/work/acer-ifa-opening/img-13.jpg", span: "half" },
      { src: "/work/acer-ifa-opening/img-14.jpg", span: "half", caption: "next@acer 標版:全片收在品牌開場。" },
    ],
  },
  {
    slug: "asus-rt-ax88u",
    no: "06",
    title: "ASUS RT-AX88U 路由器產品影片",
    titleEn: "ASUS RT-AX88U Product Film",
    category: "Motion / Product Film",
    summary: "黑金質感的路由器功能敘事影片。",
    status: "ready",
    cover: "/work/asus-rt-ax88u/cover.jpg",
    client: "ASUS",
    role: "動態視覺 / Style Frames",
    focus: "產品質感、功能圖解、黑金光線語言",
    year: "2019",
    tools: ["After Effects", "Cinema 4D"],
    intro: [
      "路由器的規格表很長，影片只有幾十秒：哪些功能成為章節，怎麼把頻寬、防護這些抽象概念變成看得見的畫面，是這支片的核心工作。",
      "視覺定調在黑金：黑場襯產品，金色光線畫出速度與容量，功能各自有一種圖解語言——傳輸是光束、防護是網格球、親子控管是螢幕牆。",
      "從色彩腳本(color script)排出全片的明暗節奏，再逐 cut 產出 style frames 與動態規則。",
    ],
    media: [
      // 滿寬:產品主鏡頭
      { src: "/work/asus-rt-ax88u/img-01.jpg", span: "full", caption: "產品主鏡頭:黑場之上,金色輪廓光定調。" },
      // 半 + 半:剪影與連接埠
      { src: "/work/asus-rt-ax88u/img-02.jpg", span: "half" },
      { src: "/work/asus-rt-ax88u/img-03.jpg", span: "half", caption: "連接埠特寫:規格直接寫在畫面上。" },
      // 2/3 晶片章節 + 1/3 色彩計畫
      { src: "/work/asus-rt-ax88u/img-04.jpg", span: "wide", caption: "1.8GHz 四核心:電路光線長出規格文字。" },
      {
        type: "palette",
        span: "third",
        caption: "色彩計畫:墨黑到亮金的六階,電藍是防護章節的對比色。",
        swatches: ["#0a0805", "#603010", "#7a5a20", "#d8a030", "#f0e080", "#305060"],
      },
      // 滿寬:容量爆發
      { src: "/work/asus-rt-ax88u/img-05.jpg", span: "full", aspect: "aspect-[21/9]", caption: "Capacity & Efficacy:多工傳輸的彩色光束噴泉。" },
      // 半 + 半:傳輸對比
      { src: "/work/asus-rt-ax88u/img-06.jpg", span: "half" },
      { src: "/work/asus-rt-ax88u/img-07.jpg", span: "half", caption: "裝置場:滿屋子的裝置同時上線。" },
      // 2/3 親子控管 + 1/3 防護網格球
      { src: "/work/asus-rt-ax88u/img-08.jpg", span: "wide", caption: "親子控管章節:螢幕牆講時間與內容的管理。" },
      { src: "/work/asus-rt-ax88u/img-09.jpg", span: "third", aspect: "aspect-[4/5]", caption: "AiProtection:防護是一顆藍色網格球。" },
      // 半 + 半:遊戲優先與金色爆發
      { src: "/work/asus-rt-ax88u/img-10.jpg", span: "half" },
      { src: "/work/asus-rt-ax88u/img-11.jpg", span: "half", caption: "轉場爆發:金色粒子推向下一章。" },
      // 滿寬收尾:色彩腳本
      { src: "/work/asus-rt-ax88u/img-12.jpg", span: "full", aspect: "aspect-[2000/1403]", caption: "色彩腳本:全片明暗與色彩的節奏表,一張圖看完整支片。" },
    ],
  },
  {
    slug: "tough-bobas-opening",
    no: "07",
    title: "『We are Tough Bobas』片頭動態",
    titleEn: "We are Tough Bobas — Show Opener",
    category: "Motion / Title Sequence",
    summary: "二戰廣播基地風格的年代感可愛片頭。",
    status: "ready",
    cover: "/work/tough-bobas-opening/cover.jpg",
    client: "We are Tough Bobas",
    role: "動態設計 / 美術",
    focus: "年代感美術、拼貼動畫、片頭節奏",
    year: "2022",
    tools: ["After Effects", "Photoshop"],
    videoUrl: "https://vimeo.com/682172215",
    intro: [
      "《We are Tough Bobas》以英文短劇結合脫口秀的方式，用台灣的視角切入國際議題。全系列以一座隱密的廣播電台串場，片頭的任務就是把觀眾帶進這個電台。",
      "美術取材二戰風格的播報基地：舊紙、油墨、剪貼與老印刷品的質感，做成有年代感又可愛的拼貼動畫——珍奶是主角，也是台灣的暗號。",
      "從資料蒐集、分鏡到角色群像，片頭最後收在 Tough Bobas 的復古徽章標版。",
    ],
    media: [
      // 滿寬:廣播基地場景
      { src: "/work/tough-bobas-opening/img-01.jpg", span: "full", aspect: "aspect-[1400/788]", caption: "隱密電台:紙感拼貼搭出的播報基地。" },
      // 半 + 半:拼貼動畫幀
      { src: "/work/tough-bobas-opening/img-02.jpg", span: "half" },
      { src: "/work/tough-bobas-opening/img-03.jpg", span: "half", caption: "珍奶漩渦:紅藍對撞的轉場語言。" },
      // 2/3 角色群像 + 1/3 色彩計畫
      { src: "/work/tough-bobas-opening/img-04.jpg", span: "wide", caption: "角色群像:拼貼頭像圍著一桌珍奶。" },
      {
        type: "palette",
        span: "third",
        caption: "色彩計畫:深夜藍、寶藍、番茄紅到米紙白,舊印刷的對比色。",
        swatches: ["#102040", "#2000b0", "#c04040", "#a09070", "#a0d0f0", "#e6dcc6"],
      },
      // 滿寬:分鏡稿
      { src: "/work/tough-bobas-opening/img-05.jpg", span: "full", aspect: "aspect-[2732/952]", caption: "分鏡稿:片頭的鏡頭順序與動作備忘。" },
      // 半 + 半:年代感資料與首映現場
      { src: "/work/tough-bobas-opening/img-06.jpg", span: "half", caption: "美術資料:老票根、廣告與印刷品的年代感取樣。" },
      { src: "/work/tough-bobas-opening/img-07.jpg", span: "half" },
      // 2/3 舞台側拍 + 1/3 主持人直式
      { src: "/work/tough-bobas-opening/img-09.jpg", span: "wide", caption: "首映現場:片頭視覺延伸到活動背板。" },
      { src: "/work/tough-bobas-opening/img-10.jpg", span: "third", aspect: "aspect-[4/5]" },
      // 半 + 半:現場與收尾
      { src: "/work/tough-bobas-opening/img-08.jpg", span: "half" },
      { src: "/work/tough-bobas-opening/img-11.jpg", span: "half", caption: "跳起來:年代感的片頭,活著的節目。" },
    ],
  },
  {
    slug: "web-projects-2020-2021",
    no: "08",
    title: "2020–2021 網站專案精選",
    titleEn: "Website Projects Selected, 2020–2021",
    category: "Web / UI Design",
    summary: "三個網站案的介面設計與版型統整。",
    status: "ready",
    cover: "/work/web-projects-2020-2021/cover.jpg",
    client: "賈桃樂主題學期館 / 高雄市政府警察局路竹分駐所 / 台北市政府交通局",
    role: "網站介面設計",
    focus: "資訊架構、響應式版型、跨案視覺統整",
    year: "2020-2021",
    tools: ["待補"],
    intro: [
      "這頁收三個網站案：教育品牌的主題館、警政單位的路竹分駐所後台，還有台北市交通局的綠運輸活動網站——類型不同，但都要在有限的開發資源下把資訊架構理順，做出好用的響應式介面。",
      "賈桃樂主題學期館做了 A/B 兩版比較，用卡片與表單把課程資訊拆成好選好報名的流程；路竹分駐所後台把地圖、監控與告警收進同一套儀表板語言；綠運輸活動網站則用遊戲化的任務與角色，把減碳行動變成好玩的互動。",
      "三案都涵蓋桌機到手機的完整介面，色彩與版型各自對應品牌與場域，但共用同一套排版邏輯。",
    ],
    media: [
      { type: "heading", label: "01 — 職涯品牌 × 主題館網站", heading: "賈桃樂主題學期館" },
      { src: "/work/web-projects-2020-2021/img-01.jpg", span: "full", caption: "A版首頁主視覺:懸浮選單與課程入口一次到位。" },
      { src: "/work/web-projects-2020-2021/img-02.jpg", span: "half", aspect: "aspect-[1600/4186]", caption: "A版完整頁面:從主視覺到頁尾一次看完整版型。" },
      { src: "/work/web-projects-2020-2021/img-06.jpg", span: "half", aspect: "aspect-[1600/3697]", caption: "B版完整頁面:改版後的頁面節奏。" },
      { src: "/work/web-projects-2020-2021/img-03.jpg", span: "half", caption: "課程卡片列表:資訊分類與報名入口。" },
      { src: "/work/web-projects-2020-2021/img-04.jpg", span: "half", caption: "線上報名表單:欄位拆成好填的步驟。" },
      { src: "/work/web-projects-2020-2021/img-05.jpg", span: "half", caption: "B版線上預約服務。" },
      { src: "/work/web-projects-2020-2021/img-07.jpg", span: "half", caption: "後台數據儀表板:報名與流量一眼掌握。" },
      { src: "/work/web-projects-2020-2021/img-08.jpg", span: "wide", aspect: "aspect-[25/16]", caption: "手機介面:首頁、課程列表與主視覺。" },
      {
        type: "palette",
        span: "third",
        caption: "色彩計畫:品牌藍到亮黃的六階,教育感的活潑對比。",
        swatches: ["#0d3a73", "#1557ab", "#4a90d9", "#b9d8ec", "#f7de46", "#fefcef"],
      },
      { src: "/work/web-projects-2020-2021/img-09.jpg", span: "full", caption: "影音專區:環境導覽與課程影片。" },

      { type: "heading", label: "02 — 警政單位 × 監控後台", heading: "高雄市政府警察局路竹分駐所" },
      { src: "/work/web-projects-2020-2021/img-10.jpg", span: "full", aspect: "aspect-[160/61]", caption: "桌面後台介面總覽:地圖、監控與告警收進同一套儀表板。" },
      { src: "/work/web-projects-2020-2021/img-11.jpg", span: "half", caption: "警政地圖與監控點:全區設備一次掌握。" },
      { src: "/work/web-projects-2020-2021/img-12.jpg", span: "half", caption: "AI 車輛與物件辨識:即時偵測結果疊在畫面上。" },
      { src: "/work/web-projects-2020-2021/img-13.jpg", span: "third", aspect: "aspect-[39/80]", caption: "手機登入介面。" },
      { src: "/work/web-projects-2020-2021/img-14.jpg", span: "third", aspect: "aspect-[39/80]", caption: "手機地圖介面。" },
      { src: "/work/web-projects-2020-2021/img-15.jpg", span: "third", aspect: "aspect-[39/80]", caption: "手機監視畫面。" },
      { src: "/work/web-projects-2020-2021/img-16.jpg", span: "third", aspect: "aspect-[39/80]", caption: "手機儀表板。" },
      {
        type: "palette",
        span: "wide",
        caption: "色彩計畫:近黑到淺灰的六階,警用藍是唯一的高彩度。",
        swatches: ["#0d1214", "#1a2f3a", "#1a87c0", "#6fb3d6", "#ccc7c2", "#f5f6f8"],
      },

      { type: "heading", label: "03 — 公部門活動 × 遊戲化網站", heading: "台北市政府交通局 綠運輸活動網站" },
      { src: "/work/web-projects-2020-2021/img-17.jpg", span: "full", caption: "活動首頁主視覺:綠運輸的角色與插畫定調。" },
      { src: "/work/web-projects-2020-2021/img-18.jpg", span: "third", aspect: "aspect-[1600/5010]", caption: "完整頁面:從主視覺到頁尾的活動網站全貌。" },
      { src: "/work/web-projects-2020-2021/img-21.jpg", span: "third", aspect: "aspect-[1/2]", caption: "手機主畫面。" },
      { src: "/work/web-projects-2020-2021/img-22.jpg", span: "third", aspect: "aspect-[1/2]", caption: "山峰遊戲介面:減碳進度做成攀登地圖。" },
      { src: "/work/web-projects-2020-2021/img-19.jpg", span: "half", caption: "萬聖節活動:節慶限定的主題頁面。" },
      { src: "/work/web-projects-2020-2021/img-20.jpg", span: "half", caption: "綠運輸方式:把交通選項變成插畫圖鑑。" },
      { src: "/work/web-projects-2020-2021/img-23.jpg", span: "third", aspect: "aspect-[1/2]", caption: "碳排狀態:數據做成隨手可看的角色狀態。" },
      { src: "/work/web-projects-2020-2021/img-24.jpg", span: "third", aspect: "aspect-[1/2]", caption: "任務獎勵彈窗。" },
      {
        type: "palette",
        span: "third",
        caption: "色彩計畫:深綠到薄荷藍的六階,活動橘是任務獎勵的重點色。",
        swatches: ["#0d3d2e", "#4a8f5c", "#9cbe6d", "#16e6c4", "#ff8818", "#f5f6f8"],
      },
    ],
  },
  {
    slug: "bobateach-app",
    no: "09",
    title: "BobaTeach 中文教學 App",
    titleEn: "BobaTeach — Chinese Learning App",
    category: "App / Product UI",
    summary: "遊戲化中文教學 App 的介面與設計系統。",
    status: "ready",
    cover: "/work/bobateach-app/cover.jpg",
    client: "BobaTeach",
    role: "UI / 視覺設計",
    focus: "遊戲化學習流程、角色世界觀、設計系統",
    year: "2025-2026",
    tools: ["Figma", "After Effects", "Illustrator"],
    intro: [
      "教語言的 App 最怕變成無聊的單字表——尤其教的是中文,對外國學習者,光是筆畫與聲調就足以讓人放棄。BobaTeach 的任務,是把「學中文」變成一件會想每天打開的事。",
      "設計把學習流程包成一場遊戲:可愛角色帶著你在木質地圖上一關一關前進,章節、課程、影片與升級獎勵都收進同一套溫暖的世界觀。介面語言鎖定圓角、地圖插畫與奶茶色調,讓每一步都有回饋感。",
      "底層是一套完整的設計系統——圖標、字級、狀態色、Tab 導覽到升級動畫流程——讓 App 從商店頁到課程內頁,都是同一個 BobaTeach。",
    ],
    media: [
      // 滿寬開場:App Store 橫幅「step by step」
      { src: "/work/bobateach-app/img-01.jpg", span: "full", aspect: "aspect-[2778/1284]", caption: "循序漸進學台灣中文:App Store 主視覺。" },
      // 半 + 半:首頁與章節選擇(同比例)
      { src: "/work/bobateach-app/img-02.jpg", span: "half", aspect: "aspect-[926/428]", caption: "首頁:角色與世界入口,商店與場景收在下緣。" },
      { src: "/work/bobateach-app/img-03.jpg", span: "half", aspect: "aspect-[926/428]", caption: "章節選擇:左右滑動的關卡地圖。" },
      // 三分之二 + 三分之一:升級動畫分鏡(裁去右側大片留白)+ 色彩計畫在右
      { src: "/work/bobateach-app/img-07.jpg", span: "wide", aspect: "aspect-[1600/617]", caption: "升級動畫流程:一整條分鏡串起升級的節奏。" },
      {
        type: "palette",
        span: "third",
        caption: "色彩計畫:地圖棕、天空藍到奶油白的六階,珍奶沙色打底,活力橘是回饋重點色。",
        swatches: ["#7a483f", "#3865a6", "#a4c9fe", "#d6c1a2", "#f7b058", "#fbf7eb"],
      },
      // 三等分:地圖旅程 / 章節狀態 / 影片課程(同為直式狀態圖)
      { src: "/work/bobateach-app/img-04.jpg", span: "third", aspect: "aspect-[966/1364]", caption: "學習地圖:一關一關往前的旅程狀態。" },
      { src: "/work/bobateach-app/img-05.jpg", span: "third", aspect: "aspect-[966/1437]", caption: "章節切換:鎖定與解鎖的三種狀態。" },
      { src: "/work/bobateach-app/img-06.jpg", span: "third", aspect: "aspect-[966/1364]", caption: "影片課程:看片、獎勵結算與重看。" },
      // 滿寬:產品流程圖(彈窗跳轉地圖,資訊量大,獨立滿版好讀)
      { src: "/work/bobateach-app/img-08.jpg", span: "full", aspect: "aspect-[1600/1816]", caption: "產品流程:彈窗與畫面之間的跳轉地圖。" },
      // 收尾段落:官網影片截圖,依影片時間序排列,最後以品牌收尾卡滿版做結
      { type: "heading", label: "官網影片", heading: "把品牌,演成一支影片。" },
      { src: "/work/bobateach-app/img-14.jpg", span: "third", aspect: "aspect-[1600/900]", caption: "開場:兩位主持人與吉祥物一起打招呼。" },
      { src: "/work/bobateach-app/img-15.jpg", span: "third", aspect: "aspect-[1600/900]", caption: "可理解輸入:手機情境疊加互動小遊戲。" },
      { src: "/work/bobateach-app/img-16.jpg", span: "third", aspect: "aspect-[1600/900]", caption: "隨處學習:海邊也能滑手機上課。" },
      { src: "/work/bobateach-app/img-17.jpg", span: "third", aspect: "aspect-[1600/900]", caption: "角色反應:誇張表情拉近教學距離。" },
      { src: "/work/bobateach-app/img-18.jpg", span: "third", aspect: "aspect-[1600/900]", caption: "文化情境:廟宇香爐,把日常文化帶進課程。" },
      { src: "/work/bobateach-app/img-19.jpg", span: "third", aspect: "aspect-[1600/900]", caption: "內容宇宙:影片、圖片、課本收進同一個世界。" },
    ],
  },
];

export function projectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
