# 実験ログ: 仕様の穴

「仕様だけから一意に決まらなかった判断」の記録。分類:

- [A] Normative の欠落・矛盾 → 手を止めて仕様へ戻す(契約修正+版バンプ)
- [B] Web の表現として正当な選択 → 仮置きを記録。仕様は沈黙のままでよい
- [C] 仕様は決めているが、機械(適合テスト)が照合できない → 検査の課題として記録

| # | 部品 | 何が決まっていなかったか | 仮置き | 分類 |
|---|---|---|---|---|
| 1 | Button | start / end スロットと文字の間隔の段。契約は「spacing の inline を引く」とだけ書き、sm / md / lg のどれかを指定していない | `inline-sm` を仮置き → 契約 alpha.5 が inline-md(8px) を明記し解消。実装追従済み | A(解消済み。仕様へ戻す運用の最初の実例) |
| 2 | Icon | アイコンセット未受領のため name → グリフの描画が定義できない | 実装保留(スタブも作らない) | A・既知(iconography.md §6 の TODO と整合。セット受領で解消) |
| 3 | Button | disabled の機構(native 属性 か aria-disabled か)は Web の表現として実装に委ねられている | native `disabled` 属性を選択。根拠: 契約の mirrorsNativeAttr、抑制(state.md §3.2)が無償、支援技術からは閲覧カーソルで到達可能 | B(state.md §5 の3要求は満たす。実測検証は実装 Done の条件) |
| 4 | Button | click イベントの FW 写像 | Svelte 5 の callback prop(`onclick`)に写像 | B(契約: 命名は各 FW の規約に写像される) |
| 5 | StemcellProvider | themes(カスタムテーマ)の色→CSS 変換ユーティリティの置き場所が仕様側で未決 | 実装保留。渡されたら warn を出して無視 | A・既知(StemcellProvider.md §9。tokens 側に置く判断が要る) |
| 6 | Button | pressed の視覚の Web 機構 | `:active` 擬似クラス | B(state.md §3.3 の発火条件の記録と整合) |
| 7 | (harness) | enum を持たない string prop(theme 等)は適合テストが値を照合できない | 名前と既定値のみ照合 | C(契約スキーマの表現力の既知の限界と同根) |
| 8 | Switcher | 閾値評価の実現機構(契約が expressive と明示) | flex-basis 算術(Every Layout 同型)。コンテナクエリは `@container` の条件部が custom property を受けず、prop 駆動の閾値をインスタンスごとに運べないため不採用 | B(切替点の正確さは実測済み。experiments/switcher-threshold/RESULTS.md §1) |
| 9 | Switcher | gap の値語彙(段+大域の原始 X)の不正値時の挙動 | console.warn(無条件。Provider の themes 警告と同じ形)を出し既定の md へ退避 | B(仕様は沈黙のままでよい) |
| 10 | Switcher | threshold の不正値時の挙動。長さでない文字列は calc() を無効にし、flex-basis が auto へ縮退して閾値駆動(Normative)が無警告で内容駆動の折返しに戻る(独立レビューが実測で検出) | 検査(rem の長さか)を行い、不正なら warn して既定 30rem へ退避。当初は構文(CSS の長さか)のみ裁いていたが、単位が rem と裁定され(2026-07。契約 alpha.1。PR #12 で main マージ済み)rem 以外も拒否に更新。数値集合の語彙は未決のまま裁かない | B(解消に向け更新済み。数値集合は Grid min と共有の未決) |
| 11 | Box | 逃げ道(自由 style)の Svelte での形。契約は中立表面(inset)だけを持ち、逃げ道は各実装の土地の声(layout.md §6 の裁定) | `as`(要素の多相)+ `style` + `class` の3口。rest props の全面開放は採らない(開くほど「素の div」に近づき、逃げ道の集約という規範の意味が薄れる)。as は意味的要素の許可リストで裁く: 型だけでは script / style / iframe も通り、危険要素をそのまま生成できた(独立レビューが実測で検出。許可外は warn して div へ退避) | B(消費者が現れて足りなければ広げる) |
| 12 | Box | inset 語彙外の値の退避先。gap 系は既定 md へ退避するが、inset の契約既定は「余白なし」 | warn して余白なし(省略時と同じ)へ退避。存在しない md を発明しない | B |
| 13 | TextField | native の確定 change の遮断(field.md §5 の申し送り: Svelte は light DOM のため構造的保護が無い)。さらに罠が一段深かった: Svelte 5 は change をルートへ委譲するため、バブル側の onchange で stopPropagation しても手遅れで、祖先のリスナーには既に届いている(テストの RED で実証) | 委譲されない capture 側(onchangecapture)で stopPropagation する。契約の change(逐次)は oninput から発火 | B(field.md §5 が予告した取り違えの実装保証。テストが門) |
| 14 | TextField | readonly×invalid が同時に宣言されたときの挙動。仕様は「同時に成立しない」(state.md §6)とだけ定め、宣言されたらどうするかは書いていない | warn して invalid を落とす(aria-invalid を立てず、error 部位も出さない)。Switcher の不正値と同じ warn+退避の形 | B |
| 15 | TextField | value の FW 写像。契約は value + change(逐次)で、uncontrolled は「土地の便宜であり契約外」(field.md §5) | `$bindable` にして bind:value を許す(Svelte の土地の声)。値の所有が実効になる経路は bind: アプリが onchange で差し戻した値は DOM へ流れる(テストで実測)。非 bind + onchange はキーストローク単位の拒否が効かない uncontrolled + 通知(React の defaultValue+onChange 相当)であり、それでも value prop の更新(リセット等)は入力後も DOM へ流れる(テストで実測)。以前ここには「bind しない消費者には controlled + onchange がそのまま成立する」と書いてあった。独立レビューが実測で反証した(非 bind で拒否した文字が DOM に残る)ので訂正する | B(HOLES #4 と同型。React 型の強制同期は bind の存否を検出できない Svelte では bind と両立しない) |
| 16 | TextField | Web の確定タイミング(blur / Enter)の器(web 規範層)を作るか。field.md §8 が「svelte 実装実験で判断する」としていた | 作らずに実装できた。表面は閉じている(rest props 無し)が、light DOM では focusout / keydown が部品の外へバブルするため、確定が欲しいアプリは包む要素で捕捉して組める(#13 と同じ機構の裏面。個別の実測テストは無し)。器は必要の立証待ちを推奨 | B(仕様側 field.md §8 の TODO への報告事項。裁定はオーナー) |
| 17 | TextField | disabled×invalid のときの error 部位の文字の扱い(field.md §8 の未決 TODO)。枠の色は state.md §3.1 が disabled 勝ちと定めるが、error 文字を消すかは未決 | error 文字は出したまま(色も danger.soft-fg のまま)。何が悪いかの情報を disabled が奪う理由は無いと読んだ。枠の disabled 勝ちは CSS の後勝ちで実装し、smoke が回帰保護する(独立レビュー major 指摘で追加) | A・既知(field.md §8 の TODO と整合。仕様の裁定で変わりうる) |
| 18 | (仕様側) | tokensRequired の欠落: TextField.css は shape.border-width と focus-ring の幾何(width / style / offset)を使うが、契約の tokensRequired に無い。同じ欠落は Button(shape.border-width)にもあり、Divider / Card は宣言している。適合テストはこれらの存在を検査できない | 仕様へ還元して解消。さらに幾何3点は focusRing:true が暗黙要求する規則に格上げした(裁定 2026-07。GOVERNANCE §6-1・focus-ring.md §4)。契約は幾何を列挙せず引き金 focusRing:true だけを挙げ、spec の check と svelte の conformance 生成器が両方その含意を検査する。shape.border-width は枠を持つ部品が個別に宣言する(還元済み) | A(解消済み。仕様へ戻す運用の実例。独立レビュー minor 指摘が発端) |
| 19 | (harness) | 適合テスト生成器は契約の states / slots / events / a11y.notes を照合しない(props と tokensRequired のみ)。「適合 N」の green は実質より強く聞こえる | 目視レビューで担保。states 等の機械照合は META の拡張が要る(実装側に states の機械可読な表明が無い) | C(#7 と同根。独立レビュー minor 指摘) |
| 20 | Grid | min の値語彙(数値集合・単位)は未確定の seed(layout.md §9)。不正値は grid-template-columns を丸ごと無効にし、内在の格子(Normative)が無警告で単一列へ縮退する(experiments/grid-sidebar-width §3 で実測) | 構文検査(rem の長さか)を行い、不正なら warn して既定 16rem へ退避。rem に限るのは仮置きだったが、単位 = rem が仕様に記録され解消した(2026-07。Grid 契約 alpha.1。container の rem 判断と threshold 裁定の適用)。数値集合は裁かない。裁定材料は RESULTS.md §2(列数の行列。段にするなら 8/12/16/20/24/32rem 程度が互いに区別に効く) | B(値語彙の裁定はオーナー案件) |
| 21 | Sidebar | sideWidth / contentMin の不正値時の挙動。sideWidth の値語彙は Grid min と共有 | sideWidth: 閉じた6段(Grid min と同じ。契約 alpha.2)以外は warn して省略時(内容幅)へ退避。contentMin: 百分率(0〜100)以外は warn して既定 50% へ退避 | A(sideWidth の段は #20 と同時に解消。contentMin は B) |
| 22 | Sidebar | 契約は prop `side`(enum)と slot `side`(脇の中身)を同名で持つが、Svelte 5 は snippet も props も同一名前空間のため 1:1 で写像できない(Lit は attribute と slot が別名前空間で衝突しない) | 当初は slot 側を `sideSlot` へ写像した。裁定(2026-07)で仕様側が解消: GOVERNANCE §4 に「props / slots / events は名前を共有しない」が成文化・機械化され、Sidebar 契約 alpha.1 が slot を `aside` へ改名した。実装は追従して `aside` snippet を受ける | A(解消済み。実装の実測が仕様の統治規則を生んだ実例) |
| 23 | Sidebar | 折返しの実現機構(契約が expressive と明示) | flex-wrap + 本体 flex-grow 999 / min-inline-size(Every Layout 同型)。折れ点は算術どおりで viewport から独立(experiments/grid-sidebar-width §5 / §6 で実測) | B(Switcher HOLES #8 と同じ形) |
| 24 | Button | form 内での type の既定。実装が native の button を素のまま出すと HTML の既定により form 内で submit として振る舞う(独立レビューが実測で検出: form に入れて click すると submit イベントが発火する) | 仕様が裁定した(2026-07。Button.md §6)。Web 実装は type(button/submit/reset。既定 button)を持つ。中立契約には無い Web 層の取り決めのため META ではなく WEB 定数で持つ。既定 button で暗黙送信を塞ぎ、type=submit で送信されることを jsdom で実測した | A(解消済み。実測材料が仕様の裁定を生んだ) |
