# 実験ログ: 仕様の穴

「仕様だけから一意に決まらなかった判断」の記録。分類:

- [A] Normative の欠落・矛盾 → 手を止めて仕様へ戻す(契約修正+版バンプ)
- [B] Web の表現として正当な選択 → 仮置きを記録。仕様は沈黙のままでよい
- [C] 仕様は決めているが、機械(適合テスト)が照合できない → 検査の課題として記録

| # | 部品 | 何が決まっていなかったか | 仮置き | 分類 |
|---|---|---|---|---|
| 1 | Button | start / end スロットと文字の間隔の段。契約は「spacing の inline を引く」とだけ書き、sm / md / lg のどれかを指定していない | `inline-sm` を仮置き | A(仕様に段の明記が要る) |
| 2 | Icon | アイコンセット未受領のため name → グリフの描画が定義できない | 実装保留(スタブも作らない) | A・既知(iconography.md §6 の TODO と整合。セット受領で解消) |
| 3 | Button | disabled の機構(native 属性 か aria-disabled か)は Web の表現として実装に委ねられている | native `disabled` 属性を選択。根拠: 契約の mirrorsNativeAttr、抑制(state.md §3.2)が無償、支援技術からは閲覧カーソルで到達可能 | B(state.md §5 の3要求は満たす。実測検証は実装 Done の条件) |
| 4 | Button | click イベントの FW 写像 | Svelte 5 の callback prop(`onclick`)に写像 | B(契約: 命名は各 FW の規約に写像される) |
| 5 | StemcellProvider | themes(カスタムテーマ)の色→CSS 変換ユーティリティの置き場所が仕様側で未決 | 実装保留。渡されたら warn を出して無視 | A・既知(StemcellProvider.md §9。tokens 側に置く判断が要る) |
| 6 | Button | pressed の視覚の Web 機構 | `:active` 擬似クラス | B(state.md §3.3 の発火条件の記録と整合) |
| 7 | (harness) | enum を持たない string prop(theme 等)は適合テストが値を照合できない | 名前と既定値のみ照合 | C(契約スキーマの表現力の既知の限界と同根) |
