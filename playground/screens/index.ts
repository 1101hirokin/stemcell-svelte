/** 画面の目次。並びはロードマップのクラスタ順(WORKFLOW §クラスタ表)。 */
export const SCREENS = [
  { id: 'actions', label: 'アクション', note: 'クラスタ1。押すと何かが起きるもの。行き先が変わるのは Link、その場で起きるのは Button。' },
  { id: 'display', label: '静的な表示', note: 'クラスタ2。読むもの。押せない印(Badge)と分類の札(Tag)と文字の役(Text)。' },
  { id: 'progress', label: '進行', note: 'クラスタ3。待ちと進みを告げる。終わりが分かるのが Progress、分からないのが Loader、代役が Skeleton。' },
  { id: 'surfaces', label: '面', note: 'クラスタ4。地の上に置く器と、その場に留まる報告。' },
  { id: 'layout', label: 'レイアウト原始', note: 'クラスタ5。意味を持たない器。12本すべてがここに並ぶ。' },
  { id: 'forms', label: 'フォームの核', note: 'クラスタ6。値を受け取る欄。名前は必須で、値はアプリが持つ。' },
  { id: 'selection', label: '選択と集合', note: 'クラスタ7。集合から選ぶ。矢印キーの語彙がここで効く。' },
  { id: 'overlays', label: 'オーバーレイ', note: 'クラスタ8。一時的に浮かぶ面。焦点と退出の扱いが類ごとに違う。' },
  { id: 'navigation', label: 'ナビゲーション', note: 'クラスタ9。行き先と現在地。Collection の語彙と current の初消費。' },
  { id: 'data', label: 'データ表示', note: 'クラスタ10。項目の並び、畳んで開くもの、そして日付。' },
  { id: 'ai', label: 'AI 有機体', note: 'クラスタ11。会話の part の上に乗る面。進行を値で持ち、段階が支援技術へ届く。' },
  { id: 'foundations', label: 'foundation の実験', note: '部品ではなく、トークンの値を実物で見比べる器。裁定の材料に使う。' },
] as const;

export type ScreenId = (typeof SCREENS)[number]['id'];
