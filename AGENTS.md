<!-- 自動生成。編集しない(源は契約と agents/generate.ts。再生成は bun run agents) -->
# @stemcell/svelte エージェント向けガイド

stemcell デザインシステムの Svelte 5 実装。部品の事実は機械可読契約
(stemcell-component-prompts)から生成されており、このファイルと契約が食い違ったら契約が正である。

## 前提(まずこれだけ守る)

- Svelte 5(runes)。named import: `import { Alert, Avatar, Badge, Box, Button, Card, Center, Checkbox, CircularLoader, CircularProgress, Cluster, Container, Cover, Dialog, Disclosure, Divider, Drawer, Frame, Grid, Icon, IconButton, Imposter, LinearLoader, LinearProgress, Link, Menu, Popover, Radio, RadioGroup, Reel, Select, Sidebar, Skeleton, Slider, Sources, Stack, StemcellProvider, Switch, Switcher, Tag, Text, TextField, Textarea, Toast, Toaster, ToolCall, Tooltip } from '@stemcell/svelte'`
- tokens の CSS をアプリの入口で読み込む: `import '@stemcell/tokens/standard.css'`
  (密度切替を使うなら `import '@stemcell/tokens/density-compact.css'` も)
- `StemcellProvider` をアプリのルートに1回だけ、自己完結タグで置く: `<StemcellProvider theme="auto" />`。
  DOM を出さない副作用であり、子を包まない。複数回置かない。「入口」とはアプリの最上位
  (vite なら main.ts と最上位コンポーネント。単一ファイルの実験なら App.svelte でよい)
- 生成したコードは svelte-check(型)で検証できる。存在しない prop / snippet は型エラーになる

## 契約 → Svelte の写像(全部品共通)

- イベントは callback prop で受ける。契約の `click` は `onclick={fn}`、`change` は
  `onchange={(value) => ...}`(payload は第1引数)。`on:click` ディレクティブ形式ではない
- slot は snippet で渡す: `{#snippet label()}氏名{/snippet}`。default slot は子要素をそのまま書く
- 値の prop(`value` / `checked` / `indeterminate`)は bind に対応する($bindable)。
  `bind:value` / `bind:checked` が使える。アプリが値を所有して拒否・整形したい場合は bind + onchange で
  差し戻す。非 bind(prop + onchange)でも動くが、キーストローク/切替単位の拒否は効かない
  (アプリが onchange で state を更新した分だけ反映される)
- 間隔(gap / inset)の語彙は 段("sm" / "md" / "lg")または大域の原始("8"〜"24" の整数の文字列)。
  生の px・任意の CSS 値は受けず、warn して既定へ退避する
- 長さ(threshold / min / sideWidth)の単位は rem の文字列("30rem" 等)。px は受けない
- 色・寸法を style で直接上書きしない。トークンの外の値は使わない

## よくある誤り

- error slot は invalid が true のときだけ描画される。常時渡してよい(出し分けは部品がやる)
- placeholder を label の代わりに使わない(label は必須の snippet)
- Button は `type`(`button` / `submit` / `reset`。既定 `button`)を持つ。これは Web 層の
  取り決めで中立契約には無いため、上の props 表には現れない(Button.md §6)。既定 `button` は
  `<form>` 内でも送信しない(HTML 既定の暗黙送信の罠を塞ぐ)。フォームを送信するボタンには
  明示的に `type="submit"` を指定する。送信の副作用そのものはアプリが書く
- blur / focus のイベントは契約に無い。確定タイミングが要るなら部品を包む要素で
  focusout / keydown を捕捉する
- autocomplete は WHATWG Autofill の語彙で書く(例: name / email / tel / postal-code /
  street-address / organization)。個人情報を集める欄では省略しない
- disabled と invalid が同時のときは disabled の見た目が勝つ(仕様)
- Icon は二つの口を持つ(iconography.md §6)。`<Icon name="check" />`(中立契約。文字列。使う分だけ
  でなく全 208 グリフが束に入る。読み込みは name 使用時のみの別チャンク)/ `<Icon glyph={check} />`
  (Web 方言。`import check from '@stemcell/icons/check'` で静的に取って渡す。使ったものだけ束に入る=
  ツリーシェイク)。バンドルを絞りたいときは glyph 渡しを使う

## 部品

### Alert(契約 0.0.0-alpha.1)

文での報告。その場に留まり、状況が続く限り読める。勝手に消えてよい報告は Toast の仕事。

props:

- `color`: "danger" | "warning" | "success" | "info"(既定 "info") — 報告の intent(color.md §5)。Badge と同じ4値・同じ既定。primary / plain を含まない理由も同じ(行動の語彙を報告に使わない)。
- `dismissible`: boolean(既定 false) — 閉じられる報告。既定は閉じられない: 報告する状況が続く限り読めるべきで(第1条)、状況が真のまま消せる既定は情報の喪失である(導出は Alert.md §2。Tag と同語彙)。

events(Svelte では callback prop):

- `ondismiss`: (payload: void) => void — 閉じる操作。取り除くのはアプリ(Alert は自分を消さない。Tag の dismiss と同じ向き)。

slots(Svelte では snippet。default は子要素をそのまま):

- `title` — 見出し。短い要約。
- `default`(必須) — 本文。何が起きているか、どうすればよいか。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 報告は支援技術へ割り込みの度合いつきで届く。即時の割り込み(Web の表現は role=alert 相当)は danger だけに絞り、warning / success / info は穏当な告知(role=status 相当)とする。これは Stemcell 独自の規範である: 業界に intent からの自動連動の前例は無く(MUI は severity に関わらず role=alert 固定で、穏当なものへの手動上書きを案内する)、role=alert は乱用への警告が実務に定着している。warning を穏当側に置くのは color.md §5 の定義(進めるが、進む前に読むべきことがある — 緊急ではない)から。
- 割り込みは Alert が動的に挿入されたときにだけ起きる。初期描画から存在する Alert は読み上げ順で届き、割り込まない(ARIA の実務: 静的な内容への role=alert は期待した告知を起こさない)。実装はこの条件を契約の一部として扱う。
- 閉じる操作(dismissible)は内部の押せる要素であり、focus を受け、フォーカスリングが必須で、当たり判定の門の対象である。ルートの focusRing: false は Alert 自身が focus を受けないという意味で、内部要素を免除しない(条件付きで生える部分要素の a11y をスキーマは表現できない。Tag と同じ限界の認識)。リング色は既定の app.system(tokensRequired に束縛)。名前は「閉じる」+ 文脈で合成し、title 内のリンク等と入れ子にせず兄弟として構成する(Tag の × と同じ規範)。
- intent の絵(先頭のアイコン)は色に頼らない識別の手がかりでもある(WCAG 1.4.1: 色だけで報告の種類を伝えない)。絵の意味名はアイコンセット受領時に確定(iconography.md §6)。
- title は Alert 自身の名前にしない(aria-labelledby 相当の配線をしない)。Alert は名前を持つ部品ではなく、内容が読み上げ順そのままに届く領域である。

### Avatar(契約 0.0.0-alpha.1)

人(主体)の顔。src の画像 → name のイニシャル → 既定グリフ、の順で退避する(第7条)。退避しても寸法・形・名前は不変で、壊れてよいのは絵だけである。

props:

- `src`: string((省略可)) — 画像の場所。観念は「主体の画像への参照」であり、URL か native のリソース参照かは各プラットフォームの表現。
- `name`: string — 主体の名前(必須)。イニシャルの源であり、意味を運ぶときのアクセシブルネーム。画像があっても必須: 画像が落ちた瞬間に名前が要る(第7条の退避先を常に持つ)。
- `size`: "sm" | "md" | "lg"(既定 "md") — size.md §2 の avatar チャンネル(裁定)。段が引くのは avatar.{size} トークン(24/32/40px。rem 建て)。
- `decorative`: boolean(既定 false) — 支援技術から隠すか(§3)。既定 false は意味を持つ(支援技術に画像として認識され name が届く。Web の表現は role=img)。隣に可視の名前があるとき true にして装飾へ落とし、名前の二重読みを避ける。境界は Icon の label と同じ(消したとき情報が失われるか。iconography.md §5)。既定を false にするのは第1条の側に倒すためで、指定漏れは冗長(名前の二重読み)にはなるが名前を失わない。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 隣に名前のテキストがあるときは装飾(decorative=true で支援技術から隠す)。単独で主体を示すときは name が届く(decorative=false。既定)。境界は Icon と同じ「消したとき情報が失われるか」(iconography.md §5)。既定を meaningful に倒すのは、指定漏れが情報損失でなく冗長で済む側だから(第1条)。
- 相互作用しない。押せる形を Avatar 自身は提供せず、当たり判定の門(size.md §4)の対象外である根拠はそれに尽きる。押せる顔の合成経路は未提供(Avatar.md §5)。
- イニシャルの文字は avatar 寸法から導く内部表現であり、typography 役割の系に乗らない(size.md §2「段は文字を引かない」を破らない)。切り出し規則は Normative な共有アルゴリズム(2026-07-23 確定。Avatar.md §5: 2語以上=先頭語と末尾語の頭字、1語=ラテンは先頭2字・非ラテンは先頭1字、いずれも書記素単位で大文字化): 同じ name から実装ごとに違うイニシャルが出れば共通言語が割れる。

### Badge(契約 0.0.0-alpha.1)

状態や数の小さな印。読むものであって、押すものではない。数(count)と存在(dot)だけを扱う: 文字の札は Tag、文の報告は Alert / Toast の仕事。

props:

- `count`: number((省略可)) — 量の報告。非負整数を期待する(スキーマは数値範囲を表現できないので、これは散文の契約である)。dot=true のときは使われない。
- `max`: number(既定 99) — count がこれを超えたら「max+」に丸める。丸めは部品の仕事(全実装で同じ見た目=共通言語)。丸めても量の意味は保ち、存在(dot)へ自動降格はしない(導出と裁定は Badge.md)。
- `dot`: boolean(既定 false) — 存在の報告。数を出さない明示のモード。count の桁あふれから自動で dot になることはない: 量と存在は違う意味であり、意味の降格を部品が勝手に行わない(state.md §6「状態と値を混ぜない」と同じ線)。
- `label`: string((省略可)) — 印の意味を支援技術へ届ける文字列(「新着あり」等)。dot のとき事実上必須である: 点は視覚でしか語らないので、これが無いと見える人にだけ通知がある状態になる(第1条)。機械は付け忘れを捕まえられない(Icon の label と同型)。count のときは省略してよい(数自体が届く)。
- `color`: "danger" | "warning" | "success" | "info"(既定 "info") — 報告の intent。primary と plain を含まない: どちらも行動にしか使わない語彙である(color.md §5「行動の intent と報告の intent」。plain を含めれば同じ名前が Button では行動・Badge では報告を意味し、共通言語が割れる)。中立な数の報告は info が担う。
- `variant`: "filled" | "soft"(既定 "filled") — 既定は filled。Badge は注意を導く印であり(第3条: 強弱で注意を導く)、soft の印は印にならない。常時そこにあってよい分類の札(soft 既定)は Tag。

slots(Svelte では snippet。default は子要素をそのまま):

- `default` — 印を重ねる相手(anchor)。IconButton 等を包み、隅に印が乗る。省略時は行内に単独で並ぶ。重なりの z は部品内部の関心で layering の層ではない。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 押せない。states を持たず、当たり判定の門(size.md §4)も適用外。押せる印が要るなら IconButton + Badge の合成である。
- count は数として支援技術に届く。「max+」の読み上げ表現(「99以上」等)は各実装の表現。
- dot の存在情報は Badge 自身の label prop が運ぶ(視覚に隠したテキスト等、機構は各プラットフォームの表現)。anchor 側の名前に合成することを要求しない: anchor が名前を持つ契約とは限らず、機構の無い要求は書かない。
- count が無く dot も false のとき、Badge は何も描画しない(空の Badge は無を意味する)。空のピルを描く実装と何も出さない実装が割れれば仕様の穴になる(GOVERNANCE §7)ので、ここで定める。

### Box(契約 0.0.0-alpha.1)

内在スタイルの器。唯一の最高自由度の逃げ道(layout.md §6)。ただし逃げ道(自由 style の受け口)は契約に無い(裁定): プラットフォーム中立に定義できないため、契約はトークン値の中立表面だけを持ち、生 style の口は各実装の土地の声である。

props:

- `inset`: string((省略可)) — 内側余白。spacing の語彙。段(sm / md / lg)または大域の原始 X(8〜24 の整数の文字列。32px〜)。小域の原始(0〜7)は受けない(spacing.md §6: 小域は意味層で。layout.md §6)。生の px は受けない。1値は全周に、2値「block inline」(空白区切り。block=縦 / inline=横 の論理軸)は軸別に与える。padding は本来2軸を持ち、軸別指定は全プラットフォーム共通の普遍(layout.md §6)。各値は上の語彙に従い、段と原始の混在も可。2値で片方が語彙外なら部分適用せず余白なしへ退避する。混合型のため string であり、値の照合は実装側の適合テストの仕事。 省略時は余白なし。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — 中身。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 見た目と意味を持たない器である。states を持たず、focus を受けず、支援技術に構造を主張しない。意味を運ぶのは中身の仕事(layout.md §6)。
- 素の器(生の div / View)の直接使用は非推奨で、逃げ道はここに集約する。この規範は契約ではなく layout.md §6 が持つ(全実装を契約の外で拘束する)。

### Button(契約 0.0.0-alpha.7)

ユーザーがその場で起こす行動。押すと何かが起きる。

props:

- `variant`: "filled" | "soft" | "outlined" | "text"(既定 "filled") — 強調度。emphasis.md §3 の4段すべてを採る。どの role をどの面に塗るかは foundations/emphasis.rules.json が1箇所で持つ。契約は名前を挙げるだけ。
- `color`: "primary" | "danger" | "warning" | "plain"(既定 "primary") — intent。disabled を含まない。選ぶものではなく、状態から差し替わる(state.md §7)。success / info も含まない。報告にしか使わない intent であり、行動には立たない(color.md §5「行動の intent と報告の intent」。裁定済み)。肯定的な確定は primary である。
- `size`: "sm" | "md" | "lg"(既定 "md") — 寸法。size.md §2 の3段すべてを採る。段が引く余白の配線は foundations/size.rules.json が持つ。
- `disabled`: boolean(既定 false) — state.md §3.1 / §5。属性か aria-disabled かは Web の表現であり第2条により固有。
- `block`: boolean(既定 false) — layout.md §2: コントロールの既定は shrink-wrap(内容幅)。block で fill(器いっぱい)にオプトインする。憲法前文の「Button を block・color=primary で」という共通言語の一部。

events(Svelte では callback prop):

- `onclick`: (payload: void) => void — 押されたことを伝える。disabled のとき発火しない（foundations/state.md §3.2）。ペイロードは持たない。以前は PointerEvent としていたが、それは Web の型であり、SwiftUI にも Compose にも存在しない。押されたという事実に、ポインタの座標も修飾キーも要らない。要る用途が出たら、そのとき中立の型で足す。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — ラベル。
- `start` — ラベルに先行するアイコン等(裁定: 明示スロット。絵と文字の間隔はリズム=構造層であり、コンポーネント内部が spacing.inline.md(8px)を引く。段は svelte 実装の実験で未指定と判明し(HOLES #1)、ここで明記した。8px は M3 の icon-label 間隔とも一致する)。中身は縛らない: stemcell セットの Icon でもプラットフォーム固有アイコンでもよい(iconography.md §2)。
- `end` — ラベルに後続するアイコン等。start と同じ規則(間隔は spacing.inline.md)。start / end は論理方向であり RTL で反転する(layout.md §7 の論理プロパティと同じ線)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- disabled は3つの要求すべてを満たすこと（foundations/state.md §5）: 活性化しない / interaction の状態が現れない / 支援技術から到達でき無効と伝わる。属性か aria-disabled かは Web の表現であり第2条により固有。
- 活性化のキーは本契約が定めない。role が意味論を運び、キーはその表現である（第2条）。Web の APG Button Pattern は Enter と Space、Link Pattern は Enter のみと定めるが、Compose の Modifier.clickable は Role に関わらず両方で発火する。キーを中立の契約に書けば Web の慣習を全プラットフォームへ漏らす。Web の規範層は未着手（component-contract.schema.json の $webKeys）。

### Card(契約 0.0.0-alpha.0)

地の上の面。内容をまとめて一枚に見せる器であり、それ自体は何もしない。押せる Card は作らない(裁定): 全面クリックは中のリンクや操作と当たり判定が入れ子になり、リンクの責任は中の要素(リンクテキスト・押せる要素)が担う。

props:

- `outlined`: boolean(既定 false) — false(既定)は影の面(elevation surface の 2-facet)、true は枠の面(影を消し border で縁取る)。prop 名が variant でないのは variant が emphasis の4段に予約済みだからである(elevated は集合に無く、面の見た目の切替は強調度の観念でもない。Skeleton の form と同じ回避)。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — 内容。器は中身を選ばない。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 意味を持たない器である。landmark や見出しは中身の仕事で、Card 自体は支援技術に構造を主張しない。
- 押せない(裁定)。states を持たず、全面クリックの口も無い。素朴な全面リンクは対話要素の入れ子で成立せず、業界の代替(stretched-link)も採らない: 操作対象が2つ以上あるとき「全面」がどの操作かは読めない(Card.md §2)。

### Center(契約 0.0.0-alpha.0)

測度(読める幅)の中で中央に置く。本文は器が広くても読める幅で頭打ちにする(layout.md §2: fill の唯一の明示的な例外)。

props:

- `max`: "sm" | "md" | "lg" | "xl" | "prose"(既定 "prose") — 幅の上限。container の段(rem 建て: 読者の文字拡大で一緒に広がる。layout.md §8)。既定 prose は測度(~66ch)。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — 中身。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 見た目と意味を持たない器である。states を持たず、focus を受けず、支援技術に構造を主張しない。意味を運ぶのは中身の仕事(layout.md §6)。

### Checkbox(契約 0.0.0-alpha.1)

集合からの選択、または同意。送信(確定ステップ)を伴いうる(field.md §7 の線引き。裁定済み 2026-07)。即時反映する単独の設定なら Switch を使う。label のリッチ内容(リンク内包)の検算器(field.md §6)。

props:

- `name`: string((省略可)) — フォーム内でのフィールド名(native の <form> 送信・FormData・reset に参加。field.md §5)。controlled の checked と両立する非破壊の上乗せ。Web は native の name 属性(checked のとき値が送信に載る)。
- `checked`: boolean(既定 false) — 値であって状態ではない(state.md §6)。アプリが所有し、部品は change で通知するだけ(field.md §5)。語彙は Switch と同一(field.md §7: 同じ観念が二つの名を持てば共通言語が壊れる。第2条)。
- `indeterminate`: boolean(既定 false) — 第三の値であり状態ではない(state.md §6: aria-checked は tristate で、mixed は第三の値)。見た目と支援技術への伝達を上書きするが、checked の値は変えない(HTML の checked 属性と indeterminate プロパティの分離と同じモデル。M3 / Carbon / Base UI / Compose の TriState も同型)。反例併記: Radix / Chakra / Polaris は checked='indeterminate' の三値で表す。boolean の checked を三値化すると Switch との語彙統一(checked は boolean)が崩れるため採らない。主用途は親子リストの集計表示。
- `disabled`: boolean(既定 false) — state.md §3.1 / §5。
- `invalid`: boolean(既定 false) — アプリが宣言する(state.md §2)。intent を danger へ差し替える(state.md §7)。主用途は必須の同意(利用規約)が満たされていない送信。
- `required`: boolean(既定 false) — チェックが必須(同意の強制が主用途)。支援技術に届くことは Normative、視覚標示は部品が自動で出す(field.md §4。裁定済み 2026-07)。

events(Svelte では callback prop):

- `onchange`: (payload: boolean) => void — 切替が起きたことを伝える。payload は新しい checked(field.md §5。裁定済み 2026-07)。indeterminate は payload に関与しない: native と同じく indeterminate は checked と独立であり、操作は indeterminate を下ろして checked をトグルするだけである。典型(checked=false かつ indeterminate=true の集計表示)では結果は true になるが、契約は checked=true との組を禁じないので、無条件に true ではない(独立レビューの指摘で断定を訂正)。checked と indeterminate の更新はアプリが行う。

slots(Svelte では snippet。default は子要素をそのまま):

- `label`(必須) — 名前。リッチ内容を許す(「利用規約に同意する」のリンク内包が動機。field.md §6 の検算はここで行われた — 結果は a11y.notes)。無名は許さない(field.md §2)。
- `description` — 説明。支援技術に説明として届く(field.md §2)。
- `error` — invalid のときのエラー文。description と並置(field.md §3。裁定済み 2026-07)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- アクセシブルネームは label の内容のテキストを平坦化して構成する(ARIA accessible name from content。リンクのテキストも名前に含まれる)。これが field.md §6 の検算結果であり、slot 形状はリッチ label でも名前を壊さない。
- label 内の対話要素(リンク)は Web の既知の罠: label で control を包む・for で結ぶ構成では、リンクの操作がチェックの切替も発火しうる(二重発火)。実装は、リンク上の活性化が切替へ伝播しないことを保証する。リンクとチェックの標的の近接は SC 2.5.8 の間隔条件(size.md §4)にかかる。
- checked / indeterminate は tristate として届く(Web の表現は aria-checked true / false / mixed)。
- Space で切り替わる(web-keys.rules.json)。Enter を足さないのは native の <input type=checkbox> と一致させるため(Enter は暗黙送信に流れる)。
- disabled は3要求すべてを満たすこと(state.md §5)。
- label は control の後ろ(論理方向)に置く。位置を構造層として凍結するかは field.md §8 の未決のまま、初版は業界の一致(全系統が後置)に従う。
- 標的の門: sm の見た目でも当たり判定は size.md §4 の下限を下回らない。

### CircularLoader(契約 0.0.0-alpha.1)

円形・不確定。いつ終わるか分からない待ちを告げる。終わりの割合が分かるなら CircularProgress。

props:

- `label`: string — 何を待っているか(必須)。回る輪は視覚でしか語らないので、意味は名前が運ぶ(IconButton の label と同型)。
- `size`: "sm" | "md" | "lg"(既定 "md") — size.md §2 の loader チャンネル(裁定: avatar と同型)。径は loader.{size}(16/24/32px)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 待ちの状態が支援技術に届く(Web の表現は role=status / aria-busy 相当)。label が「何を」を運ぶ。
- reduced-motion では回転を止めるか沈静化する(motion.md §6 の loop 特例)。待っているという意味は保つ(第7条: 壊れてよいのは感触だけ)。
- 相互作用しない。当たり判定の門(size.md §4)の対象外。

### CircularProgress(契約 0.0.0-alpha.2)

円形・確定。終わりの割合が分かる進みを見せる。分からないなら CircularLoader。

props:

- `label`: string — 何の進捗か(必須)。
- `value`: number — 現在値(必須)。state.md §6 の予約語彙。0 ≤ value ≤ max を期待する(スキーマは数値範囲を表現できないので散文の契約である。Badge の count と同型)。範囲外は呼び出し側の契約違反だが、実装は伝達の整合のため clamp する(aria-valuenow 相当を範囲外にしない。ARIA 上、min/max の外は不正である)。
- `max`: number(既定 100) — 上限。native <progress> の max と同じ観念。正の数を期待する(同上、散文の契約)。
- `showValue`: boolean(既定 false) — 可視の数値表示。既定は出さない(第3条の抑制。Ant の既定表示は採らない)。出すときの視覚の正準は「{n}%」で全実装同一、ロケール写像は表現(Badge の max+ と同型)。支援技術への値の伝達はこの prop と無関係に常に行う(第1条・Normative)。
- `size`: "sm" | "md" | "lg"(既定 "md") — size.md §2 の loader チャンネル。CircularLoader と同じ径の体系。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- value / max は常に支援技術へ届く(Web の表現は role=progressbar + aria-valuenow 相当)。バーの長さだけなら見えない人に進捗が無い(第1条)。showValue はその可視化であって伝達の条件ではない。
- reduced-motion でも値そのもの(aria-valuenow 相当と showValue の数字)は即座に正しく更新・伝達される。ただし視覚的な補間は他の transition と同じく --motion-scale に従い、reduced 時は瞬時(0ms)の切り替えになる(motion.md §6。loop のような特例は無く、コンポーネントは分岐しない)。消えるのは飾りの滑らかさであって、情報ではない。
- 相互作用しない。当たり判定の門の対象外。

### Cluster(契約 0.0.0-alpha.0)

折り返す横並び。タグの列・ボタンの列など、行に収まらなければ次の行へ流れる。全体が一斉に切り替わるのは Switcher(第2波)。

props:

- `gap`: string(既定 "md") — 要素間の間隔(両軸)。spacing の語彙。段(sm / md / lg)または大域の原始 X(8〜24 の整数の文字列。32px〜)。小域の原始(0〜7)は受けない(spacing.md §6: 小域は意味層で。layout.md §6)。生の px は受けない。混合型のため string であり、値の照合は実装側の適合テストの仕事。 段は spacing.gap の意味層を引く。
- `align`: "start" | "center" | "end"(既定 "start") — 行内の交差軸の揃え。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — 並べる中身。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 見た目と意味を持たない器である。states を持たず、focus を受けず、支援技術に構造を主張しない。意味を運ぶのは中身の仕事(layout.md §6)。

### Container(契約 0.0.0-alpha.0)

ページ幅の制約。app shell の外殻が持つ最大幅であり、本文の測度(Center)とは別物。

props:

- `max`: "sm" | "md" | "lg" | "xl"(既定 "xl") — 幅の上限。container の段。prose を含まないのは、ページの殻に測度は無関係だからである(測度は Center の仕事)。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — 中身。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 見た目と意味を持たない器である。states を持たず、focus を受けず、支援技術に構造を主張しない。意味を運ぶのは中身の仕事(layout.md §6)。

### Cover(契約 0.0.0-alpha.0)

1画面ぶんの骨格。器の高さいっぱいに立ち、主役を中央に置き、頭と足(header / footer)を保つ。

props:

- `gap`: string(既定 "md") — 頭・主役・足の最小間隔。spacing の語彙。段(sm / md / lg)または大域の原始 X(8〜24 の整数の文字列。32px〜)。小域の原始(0〜7)は受けない(spacing.md §6: 小域は意味層で。layout.md §6)。生の px は受けない。混合型のため string であり、値の照合は実装側の適合テストの仕事。 段は spacing.stack の意味層を引く(縦の間隔)。

slots(Svelte では snippet。default は子要素をそのまま):

- `header` — 頭。上端に留まる。
- `default`(必須) — 主役。残りの空間の中央に置かれる。
- `footer` — 足。下端に留まる。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 見た目と意味を持たない器である。states を持たず、focus を受けず、支援技術に構造を主張しない。意味を運ぶのは中身の仕事(layout.md §6)。

### Dialog(契約 0.0.0-alpha.2)

ビューポート中央に開く modal(overlay の modal 類)。背後を scrim で覆い操作を封じ、フォーカスを中に捕捉し、閉じたら開いた元へ戻す。アプリが開閉を所有する(Menu / Select と違い、いつ出すかはアプリの領分。open は値。overlay.md §6)。Web は native `<dialog>` + showModal() を土台にする: focus trap・top-layer・::backdrop・Escape・背後 inert が標準で無償(自前の focus trap を持たない。第7条 progressive enhancement)。退出は dismiss で選ぶ(light=Escape+背後クリック、explicit=ボタンのみ。既定 light。overlay.md §8 の裁定を本契約が解く)。端に寄せる Drawer は別契約(同じ modal 類)。RFC 0009。

props:

- `open`: boolean(既定 false) — 開いているか。アプリが所有する値(overlay.md §6)。true で showModal、false で close。light dismiss は openchange(false) を発火し、アプリが open を更新する。
- `dismiss`: "light" | "explicit"(既定 "light") — 退出の仕方(overlay.md §8 の裁定。既定 light)。light は Escape と背後(scrim)クリックで閉じる(閲覧系。慣習=Radix / MUI / Headless UI。第1条: 利用者が容易に抜けられる)。explicit はボタン(閉じる/確定/取消)でのみ閉じる(確認・破壊・未保存フォーム。誤操作で消えない)。explicit では Escape と背後クリックを無効化する。

events(Svelte では callback prop):

- `onopenchange`: (payload: boolean) => void — 開閉の要求を伝える。light dismiss(Escape / 背後クリック。dismiss=light のとき)は false を発火する。アプリが open を更新する(open を値として扱う結線。overlay.md §6)。explicit のときは light dismiss を発火せず、アプリが明示のボタンで open を落とす。

slots(Svelte では snippet。default は子要素をそのまま):

- `title`(必須) — 見出し。modal のアクセシブルネーム(aria-labelledby で dialog に結ぶ)。無名の modal を許さない(利用者が何の modal か分からない。第1条)。
- `content`(必須) — 本体。modal の内容。
- `actions` — 脚の操作(ボタン群。閉じる/確定/取消)。省略可(閲覧系は本体だけで足りる)。explicit の Dialog はここに閉じる手段を必ず置く(そうでないと閉じられない)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- Web は native `<dialog>` + showModal() を土台にする。これで focus trap(Tab が中で一周)・top-layer(overflow / transform 祖先で切れない)・::backdrop(scrim)・Escape・背後 inert が標準で無償になる(overlay.md §7: trap の実現は表現。native が無償で満たす側)。aria-modal と role=dialog は native が付ける。
- アクセシブルネームは aria-labelledby で title スロットの id を指す(無名の modal を許さない)。
- フォーカス: showModal が中へフォーカスを移し(最初の focusable。autofocus 指定があればそれ)、閉じると開いた元(トリガー)へ戻す。overlay.md §4 の modal 類(中に捕捉・元へ戻す)。復帰は native `<dialog>` が所有する(showModal 時に控えた previouslyFocused へ戻す)。トリガーが消えている場合は native の既定(document/body)に委ねる。overlay.rules.json の $orphanReturn は focus.interactiveEntersOrVirtual(popover の仮想フォーカス。RFC 0007)側の規則で、focus.trap(modal)には射程が無い(modal は native が復帰を握るため、決定的アルゴリズムを自前で挿す余地が無い)。
- 退出は dismiss で選ぶ(overlay.md §8 の裁定。既定 light)。light は Escape(native の cancel)と背後 scrim クリックで閉じ、openchange(false) を発火。explicit は cancel を preventDefault し背後クリックも閉じない(ボタンのみ)。Escape は最上位の1枚だけ(native の top-layer が LIFO を担う。overlay.md §3)。
- 多重 modal の scrim は単一に保つ(重なっても一段相当。overlay.md §8 / elevation.md §6 の単一 --scrim 前提。native ::backdrop の累積を抑える)。ただし多重 modal 自体を推奨しない(第1条: 利用者を何枚も埋めない)。
- 背後スクロール封鎖(overlay.rules.json の modal.blocksScroll)。native showModal は背後を inert にするが、body のスクロール固定は実装が併せて行う。
- 確認・破壊の Dialog に role=alertdialog を割り当てるかは将来(初版は role=dialog。alertdialog は「応答を要する通知」で、explicit + 破壊の文脈に適するが、native `<dialog>` の既定写像は dialog。立証後に足す)。

### Disclosure(契約 0.0.0-alpha.0)

開いたり閉じたりできる開示。常に見える要約(summary)の下に内容(content)を持ち、open で現す。open はアプリが所有する値(state.md §6。canonical name は open。native の <details> が open 属性を持つのと同じ観念)。トリガー(summary)の操作は openchange を発火し、アプリが open を更新する(Dialog の open と同じ向き)。Web は native <details> / <summary> を土台にする: 開閉・トリガーの button 意味論・aria-expanded・折りたたみ時の非到達が標準で無償(第7条 progressive enhancement。Dialog が <dialog> を土台にするのと同型)。複数項目をまとめて排他に開く形(Accordion)は Collection の関心で本契約は扱わない(state.md §6 が Accordion 契約へ送る。クラスタ7)。

props:

- `open`: boolean(既定 false) — 開いているか。アプリが所有する値(state.md §6。native <details> の open 属性、Radix / MUI も open)。true で content を現し、false で畳む。トリガーの操作は openchange を発火し、アプリが open を更新する(値としての結線。Dialog の open と同型)。aria-expanded はこの値のトリガー側への射影で Web の表現。

events(Svelte では callback prop):

- `onopenchange`: (payload: boolean) => void — 開閉の要求を伝える。トリガー(summary)の活性化で発火し、アプリが open を更新する(open を値として扱う結線。native <details> の toggle に対応)。

slots(Svelte では snippet。default は子要素をそのまま):

- `summary`(必須) — 常に見えるトリガー兼見出し。開閉を起こし、開示のアクセシブルネームになる(無名の開閉を許さない。第1条)。Web は <summary>、SwiftUI は DisclosureGroup の label に写る。
- `content`(必須) — open のとき現れる、折りたたみの対象の内容。閉じている間は支援技術からも到達不能(native <details> の既定)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 開示の相互作用の要素は button である(APG Disclosure Pattern: 内容の表示を制御する button)。role=button のトリガー(summary)に aria-expanded が open を射影し、aria-controls が content 領域を指す(Web の表現)。SwiftUI は DisclosureGroup、Compose は expandable の semantics が同じ観念を写す。Web は native <details> / <summary> が開閉・button 意味論・aria-expanded を標準で無償にする(第7条 progressive enhancement。Dialog の <dialog> と同型)。ただし summary と body を結ぶ aria-controls は native が自動では張らないので、必要なら実装が補う。native <details> は要素としては group を露出するが、活性化される観念は summary の button であり、role は活性化される側に立てる(focusRing と web-keys が一致する)。
- open はアプリが所有する値(state.md §6)。トリガーは openchange を発火し、アプリが open を更新する(Dialog の open・Checkbox の checked と同じ向き)。UI が内部で勝手にトグルを確定しない。
- summary は開示のアクセシブルネームで、常に見える(内容を畳んでも見出しは残る。無名の開閉を許さない。第1条)。必須。
- focus とフォーカスリングはトリガー(button)に立つ。focusRing: true はこのリングを指す(色は intent を持たないので既定の app.system。Link と同じ)。活性化のキーは button の role が導く(Enter と Space。native <summary> は両方でトグル)。契約はキーを持たない($webKeys)。content は被制御領域で、それ自身は活性化されない。
- role=button は単一のスカラーで、button のトリガーと、別に被制御の content 領域を同時には表せない。素朴に content を button の中へ入れると対話要素の入れ子(ARIA のアンチパターン)になる。summary と content は同じ階層の兄弟として構成する。契約スキーマの想定(単一の root role)の外にあり、機械検査は区別できない。スキーマの限界の認識で、Tag / Alert と同じ(Tag.md §5)。
- トリガーは当たり判定の門(size.md §4)の対象。見出しの文字が短くても判定は 24px を割らない。
- 畳まれた content は支援技術のツリーから外れ、到達できない(native <details> が隠す)。reduced-motion では現れ方が即時になる(全 duration に --motion-scale が乗る。motion.md §6。契約は分岐しない)。
- 複数の開示をまとめ、排他に開く形(Accordion)は本契約の外(state.md §6 が Accordion 契約へ送る。開示の集合と選択の管理は Collection クラスタ7の語彙)。

### Divider(契約 0.0.0-alpha.0)

区切る線。内容を持たない。余白(spacing)で区切りが足りるなら線を引かない、が既定の答えであり(第3条の抑制)、Divider は視覚的な線が要ると判断された場所にだけ現れる。

props:

- `orientation`: "stack" | "inline"(既定 "stack") — 何の流れを切るか。stack は積みの流れを(横書き Web では水平線)、inline は並びの流れを(同・垂直線)切る。値は spacing.md §4 の概念(stack / inline)と同じ論理方向であり、horizontal / vertical という物理値を採らないのは縦書きで軸が入れ替わるため(layout.md §7 の論理プロパティと同じ線)。物理方向への写像(aria-orientation の horizontal/vertical を含む)は各プラットフォームの表現。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 既定は装飾: 支援技術から隠す。意味のある区切り(セクションの境界)は見出し構造が運ぶべきで、線に意味を載せない。
- 集合の中の意味的な区切り(Menu 内の separator 等)はその集合の契約が定める。Divider 単体は意味を持たない。

### Drawer(契約 0.0.0-alpha.2)

画面の端に寄って開く modal(overlay の modal 類。Dialog が中央、Drawer は端。overlay.md §5)。背後を scrim で覆い操作を封じ、フォーカスを中に捕捉し、閉じたら開いた元へ戻す。アプリが開閉を所有する(open は値。overlay.md §6)。Web は Dialog と同じ native `<dialog>` + showModal() を土台にする: focus trap・top-layer・::backdrop・Escape・背後 inert が標準で無償(憲法 第2条 / 第7条)。位置と入りの方向だけが Dialog と違う(端に貼り付き、その端からスライドで入る)。退出は dismiss で選ぶ(既定 light。overlay.md §8。Dialog と同じ)。ナビゲーションやフィルタ等の側パネルが主用途。RFC 0009 の残課題として建てる。

props:

- `open`: boolean(既定 false) — 開いているか。アプリが所有する値(overlay.md §6)。true で showModal、false で close。light dismiss は openchange(false) を発火する。
- `side`: "inline-start" | "inline-end" | "block-start" | "block-end"(既定 "inline-end") — 貼り付く端(論理方向。layout.md §7。RTL / 縦書きで自動的に反転する)。inline-end は行末側(LTR で右)、inline-start は行頭側(左)、block-start は上、block-end は下。既定は inline-end(詳細・設定の側パネルの通例)。この端からスライドして入る。
- `dismiss`: "light" | "explicit"(既定 "light") — 退出の仕方(overlay.md §8 の裁定。既定 light。Dialog と同じ)。light は Escape と背後(scrim)クリックで閉じる。explicit はボタンでのみ閉じる(Escape と背後クリックを無効化)。

events(Svelte では callback prop):

- `onopenchange`: (payload: boolean) => void — 開閉の要求を伝える。light dismiss(Escape / 背後クリック。dismiss=light のとき)は false を発火する。アプリが open を更新する(overlay.md §6)。

slots(Svelte では snippet。default は子要素をそのまま):

- `title`(必須) — 見出し。modal のアクセシブルネーム(aria-labelledby で dialog に結ぶ)。無名の modal を許さない(第1条)。
- `content`(必須) — 本体。パネルの内容。
- `actions` — 脚の操作(ボタン群)。省略可。explicit の Drawer はここに閉じる手段を必ず置く。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- Web は Dialog と同じ native `<dialog>` + showModal() を土台にする。focus trap・top-layer・::backdrop(scrim)・Escape・背後 inert が標準で無償(overlay.md §7。第2条 / 第7条)。aria-modal と role=dialog は native が付ける。Drawer が Dialog と違うのは位置(端)と入りの方向(その端からスライド)だけで、振る舞い(捕捉・退出・封鎖)は modal 類として同じ。
- アクセシブルネームは aria-labelledby で title スロットの id を指す(無名の modal を許さない)。
- フォーカス: showModal が中へフォーカスを移し、閉じると開いた元(トリガー)へ戻す(native が復帰を所有。トリガー消失時は native 既定)。overlay.md §4 の modal 類。
- 退出は dismiss で選ぶ(既定 light。Dialog と同じ)。Escape は最上位の1枚だけ(native の top-layer が LIFO を担う。overlay.md §3)。
- 多重 modal の scrim は単一に保つ(重なっても一段相当。overlay.md §8 / elevation.md §6。native ::backdrop の累積を抑える)。多重 modal 自体を推奨しない(第1条)。
- 背後スクロール封鎖(overlay.rules.json の modal.blocksScroll)。native showModal は背後を inert にし、body のスクロール固定は実装が併せて行う。
- 側の方向は論理方向(side)である。位置(貼り付く端)とサイズは論理で持ち、RTL / 縦書きで自動反転する(視覚方向を直書きしない。layout.md §7)。入りの方向(スライドのアニメ)は Expressive で、Web の translate は物理プロパティのため RTL の水平反転までは追従するが、縦書きでの反転は範囲外(位置は正しく、入りの手触りだけが物理に留まる)。

### Frame(契約 0.0.0-alpha.0)

比の窓。中身を指定した縦横比の枠に収める。

props:

- `ratio`: string(既定 "16/9") — 縦横比。「横/縦」の整数比の文字列(例 16/9・1/1・4/3)。長さではなく形なので、トークンの語彙の外にある(seed。比の既定集合を作るかは TODO)。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — 中身(画像・動画・埋め込み)。はみ出しは枠が刈る。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 見た目と意味を持たない器である。states を持たず、focus を受けず、支援技術に構造を主張しない。意味を運ぶのは中身の仕事(layout.md §6)。
- 中身の代替テキスト等は中身の仕事。枠は意味を持たない。

### Grid(契約 0.0.0-alpha.2)

内在的な格子。列数を固定せず、器に応じて列が増減する(auto-fit / minmax。layout.md §4)。固定12列は採らない(コンテナ方針)。

props:

- `min`: string(既定 "16rem") — 列の最小幅。これを下回るなら列が減る。値は閉じた段の集合(8rem / 12rem / 16rem / 20rem / 24rem / 32rem。裁定 2026-07。単位は rem、集合はこの6段に絞る。layout.md §9)。既定 16rem。段外の値は warn して既定へ退避する(値の照合は実装側の適合テストの仕事)。段の集合は seed であり実測(列数の行列)で調整しうる。
- `gap`: string(既定 "md") — 格子の間隔(両軸)。spacing の語彙。段(sm / md / lg)または大域の原始 X(8〜24 の整数の文字列。32px〜)。小域の原始(0〜7)は受けない(spacing.md §6: 小域は意味層で。layout.md §6)。生の px は受けない。混合型のため string であり、値の照合は実装側の適合テストの仕事。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — 並べる中身。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 見た目と意味を持たない器である。states を持たず、focus を受けず、支援技術に構造を主張しない。意味を運ぶのは中身の仕事(layout.md §6)。

### Icon(契約 0.0.0-alpha.0)

語彙を絵で示す。それ自体は何もしない。stemcell 自作セット専用の描画器であり、セット外のアイコンはこれを経由せず各部品のスロットへ直接置く(iconography.md §2)。

props:

- `name`: string — セットの意味名(iconography.md §3)。名詞・後置修飾・最大3階層・複合語はアンダースコア・視覚差分(塗り/半分)は .fill / .half のサフィックス(サフィックス無しが基本形)。語彙が凍結するまで string に留め、凍結後に enum 化する(同 §3 / §7)。
- `label`: string((省略可)) — 意味を運ぶときの名前。省略時は装飾であり支援技術から隠れる(iconography.md §5)。絵を消したとき情報が失われるなら必須。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 既定は装飾: 支援技術から隠す(Web の表現は aria-hidden)。label があるときだけ意味を運び、画像として名前が届く(Web の表現は role=img + アクセシブルネーム)。
- フォーカスを受け取らない。相互作用しないので最低標的(size.md §4)も適用外。押せる絵は IconButton。

### IconButton(契約 0.0.0-alpha.0)

Button の一種。ラベルが絵になっただけで、押すと何かが起きる。variant / color / size / disabled / block / states は Button を継承する。events と slots は継承されない(スキーマの extends 意味論)ので、click は Button と同一定義で再宣言している。

props:

- `variant`: "filled" | "soft" | "outlined" | "text"(既定 "filled") — 強調度。emphasis.md §3 の4段すべてを採る。どの role をどの面に塗るかは foundations/emphasis.rules.json が1箇所で持つ。契約は名前を挙げるだけ。
- `color`: "primary" | "danger" | "warning" | "plain"(既定 "primary") — intent。disabled を含まない。選ぶものではなく、状態から差し替わる(state.md §7)。success / info も含まない。報告にしか使わない intent であり、行動には立たない(color.md §5「行動の intent と報告の intent」。裁定済み)。肯定的な確定は primary である。
- `size`: "sm" | "md" | "lg"(既定 "md") — 寸法。size.md §2 の3段すべてを採る。段が引く余白の配線は foundations/size.rules.json が持つ。
- `disabled`: boolean(既定 false) — state.md §3.1 / §5。属性か aria-disabled かは Web の表現であり第2条により固有。
- `block`: boolean(既定 false) — layout.md §2: コントロールの既定は shrink-wrap(内容幅)。block で fill(器いっぱい)にオプトインする。憲法前文の「Button を block・color=primary で」という共通言語の一部。
- `label`: string — 名前。可視ラベルが絵に置き換わったぶん、名前の経路が prop へ移る(必須)。Tooltip の併用は補強であって名前の代替ではない(overlay.md §4: hover でしか到達できない情報を作らない)。
- `shape`: "control" | "pill"(既定 "control") — shape.md §6 のカテゴリから選ぶ(発明不可)。pill は全円。既定は control(裁定: 非選択時のフォールバック)。丸いアイコンボタンと角丸のアイコンボタンはどちらも実在するので、割当てではなく選択に開いた最初の部品。

events(Svelte では callback prop):

- `onclick`: (payload: void) => void — Button と同一定義の再宣言(events は継承されないため)。押されたことを伝える。disabled のとき発火しない(foundations/state.md §3.2)。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — アイコン1つ。stemcell セットの Icon でも、プラットフォーム固有アイコン(SF Symbols 等)でもよい(iconography.md §2)。文字は置かない: 文字を持つなら Button である。start / end スロットは継承されない(スロット構成は部品の形そのもの)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 名前は label prop が運ぶ。中のアイコンは装飾(iconography.md §5)であり、名前を二重に運ばない。
- disabled の3要求と当たり判定の門/目標は Button と同じ(state.md §5 / size.md §4)。視覚が絵1つでも当たり判定は縮まない。

### Imposter(契約 0.0.0-alpha.1)

下地の上への重ね。器は下地と重ねの両方を持ち、下地が器の大きさを決め、重ねはフローの外に出て下地の上に乗る。一時面の振る舞い(フォーカス・退出)は持たない: それは overlay の部品(Dialog / Popover)の仕事。

props:

- `layer`: "navigation" | "popover" | "modal" | "notification" | "tooltip"((省略可)) — layering.md の層を指定して重ね順を取る(--layer-*-z / native は rank)。省略時は文脈のスタッキングに従い、新しい層を作らない。層の付与は重ね順だけであり、scrim やフォーカス捕捉は付いてこない(それらは overlay の部品の仕事)。 scrim を含まない: scrim は単独で意味を持たず(モーダルの捕捉機構とセットの遮蔽)、Imposter の公開 API を通さない。modal は将来 Dialog 等が内部合成に用いるための値であり、単独の消費者が直接選ぶことは想定しない(選んでも捕捉も scrim も付いてこない=偽モーダルになる)。
- `alignBlock`: "start" | "center" | "end"(既定 "center") — 重ねを下地のどこに置くか、block 軸(横書きでは縦)の位置。論理方向なので RTL / 縦書きで書字方向に従う(layout.md §7)。alignInline との組で3×3の位置を表す。段の集合が {start, center, end} なのは、この語彙が全プラットフォームで一致するからである(SwiftUI Alignment、Compose Alignment、CSS の place-self / position-area。Imposter.md §2)。2軸を1つの enum(9値)にせず prop を分けるのは、契約スキーマの enum で機械照合できる形を保つため。
- `alignInline`: "start" | "center" | "end"(既定 "center") — 重ねを下地のどこに置くか、inline 軸(横書きでは横)の位置。論理方向なので RTL / 縦書きで書字方向に従う。alignBlock と同じ段の集合を採る。

slots(Svelte では snippet。default は子要素をそのまま):

- `base`(必須) — 下地。器の大きさを決め、重ねの位置の基準になる。器が下地を持つ(重ねだけを受け取って周囲の環境に基準を求めない)ことが本部品の要である: 基準を外に求めると、重ねの位置が自分の所有しない祖先の性質で決まり、無関係な変更で黙って動く(導出は Imposter.md §2)。
- `default`(必須) — 重ねる中身。フローの外に出るので下地の大きさには影響しない。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 見た目と意味を持たない器である。states を持たず、focus を受けず、支援技術に構造を主張しない。意味を運ぶのは中身の仕事(layout.md §6)。
- 下地と重ねはどちらも支援技術から読める。重ねが下地を視覚的に覆っても、覆いに意味(モーダル性)は生まれない。それが要るなら Imposter ではなく Dialog を使う(overlay.md)。
- 読み上げの順は下地が先、重ねが後である(視覚の重なりと DOM の順を入れ替えない。WCAG 1.3.2)。

### LinearLoader(契約 0.0.0-alpha.0)

線形・不確定。いつ終わるか分からない待ちを、領域の幅で告げる。終わりの割合が分かるなら LinearProgress。

props:

- `label`: string — 何を待っているか(必須)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 待ちの状態が支援技術に届く(CircularLoader と同じ要求)。
- reduced-motion では流れを止めるか沈静化する(motion.md §6 の loop 特例)。
- 相互作用しない。当たり判定の門の対象外。

### LinearProgress(契約 0.0.0-alpha.2)

線形・確定。終わりの割合が分かる進みを、領域の幅で見せる。分からないなら LinearLoader。

props:

- `label`: string — 何の進捗か(必須)。
- `value`: number — 現在値(必須)。state.md §6 の予約語彙。0 ≤ value ≤ max を期待する(スキーマは数値範囲を表現できないので散文の契約である。Badge の count と同型)。範囲外は呼び出し側の契約違反だが、実装は伝達の整合のため clamp する(aria-valuenow 相当を範囲外にしない。ARIA 上、min/max の外は不正である)。
- `max`: number(既定 100) — 上限。native <progress> の max と同じ観念。正の数を期待する(同上、散文の契約)。
- `showValue`: boolean(既定 false) — 可視の数値表示。規則は CircularProgress と同一(視覚の正準「{n}%」・既定は抑制・支援技術への伝達は無条件)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- value / max は常に支援技術へ届く(CircularProgress と同じ要求・第1条)。
- reduced-motion でも値そのもの(aria-valuenow 相当と showValue の数字)は即座に正しく更新・伝達される。ただし視覚的な補間は他の transition と同じく --motion-scale に従い、reduced 時は瞬時(0ms)の切り替えになる(motion.md §6。loop のような特例は無く、コンポーネントは分岐しない)。消えるのは飾りの滑らかさであって、情報ではない。
- 相互作用しない。当たり判定の門の対象外。

### Link(契約 0.0.0-alpha.1)

場所が変わる。行動(Button)ではなく移動。native の <a> と <button> が分かれているのと同じ線で Button と分かれる。

props:

- `href`: string — 行き先(必須)。名前は Web の属性と一致するが観念は「遷移先」であり、SwiftUI の Link(destination:) / Compose の相当機構へ写像される。
- `external`: boolean(既定 false) — 別文脈への遷移(新しいタブ・アプリ外)を視覚と支援技術に示すオプトイン(裁定: 機構は持つが、href からの自動判定はしない。判定はアプリの知識である)。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — ラベル。 typography の束縛が無いのは書き落としではない: Link は文字の一種であり、周囲の文字の役を継承する(Link.md §2。大きさを自分で主張しない)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- disabled を持たない。native <a> に無効化は存在せず、無効な遷移は描画しない(href を外した瞬間、それはもうリンクではない)。
- visited を採らない(裁定。state.md §6): 概念が Web にしか無く、ブラウザが偽装防止のためスタイルを厳しく制限し、アプリ指向の DS は採っていない。必要が浮上したら RFC。
- 本文中では色だけで示さない(WCAG 2.2 SC 1.4.1)。下線か何かの非色手がかりを持つ。手がかりの形は Web の表現であり、要求は「色以外にあること」。
- 活性化のキーは role が導く(web-keys.rules.json: link は Enter のみ。native <a href> に一致)。
- フォーカスリングの色は intent を持たないので既定の app.system を引く(focus-ring.md §4)。tokensRequired の color.app.system がそれである。文字色の color.app.link は全 elevation 面で 4.5:1 を CI が強制している(focus-ring.md §6)。

### Menu(契約 0.0.0-alpha.1)

アクションの集合を畳んで出す一時的なメニュー(APG の menu button + menu パターン)。トリガー(button, aria-haspopup=menu)を押すと menuitem の列がポップオーバーで開き、選ぶと活性化して閉じる。値を持たない: menuitem は選択(selected)でなく行為(state.md §6。Select は値を持つが Menu は持たない)。Popover を合成する(overlay の popover 類。面/影/角/層/出入りは Popover が所有)。中への移動は実 DOM フォーカスの roving(overlay.md §4 の二形態のうち Menu 側。Select の listbox は仮想フォーカスで対を成す)。トリガーは Menu が所有し ARIA を配線する(RFC 0008。Button が閉じた契約なので asChild 型に寄せず、逃げ道は Popover プリミティブが担う。第4条)。サブメニュー(menu-in-menu)と menuitemcheckbox / menuitemradio は初版の範囲外・将来 RFC。

props:

- `items`: array — メニュー項目の列。データとして渡す(Select の options と同じ理由: 4プラットフォーム中立の契約はデータが安い。Select.md §3 / RFC 0008)。区切り(separator)と節(section)は初版で持たず、items の構造拡張で後から足せる(非破壊)。
- `disabled`: boolean(既定 false) — トリガー全体を無効化する(state.md §3.1 / §5)。開けない。
- `size`: "sm" | "md" | "lg"(既定 "md") — 寸法。size.md §2 の3段(TextField / Select と同じ)。トリガーの inset に効く。項目の密度は size 非依存で固定(Select の option が段によらず一定なのと同じ。ドロップダウンの中身は器の寸法に追従しない)。
- `placement`: "block-end" | "block-start"(既定 "block-end") — トリガーに対する優先の開き方向(論理方向)。Popover へ委譲する(Popover.placement)。画面端での反転は Expressive(overlay.md §5)。

events(Svelte では callback prop):

- `onselect`: (payload: string) => void — menuitem が活性化されたことを伝える。payload は項目の id。行為の起動であって値の変化ではない(Select の change と別物: Menu は値を持たない)。活性化するとメニューは閉じ、フォーカスはトリガーへ戻る。change でのページ遷移禁止(WCAG 3.2.2)は Select と異なり当てはまらない: Menu の select はユーザの明示的な起動であって探索中の副作用ではない。

slots(Svelte では snippet。default は子要素をそのまま):

- `trigger`(必須) — トリガー button の中身(ラベル・アイコン)。Menu が button 要素と ARIA(aria-haspopup=menu / aria-expanded / aria-controls)を所有し、中身だけを消費者が与える(Select が combobox トリガーを所有するのと同型)。アイコンのみのトリガー(オーバーフローの ⋯ 等)もここにアイコンを置いて作る。自前の button を持ち込みたい escape は Popover プリミティブへ降りる(第4条)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- APG の menu button + menu パターン。トリガーは role=button + aria-haspopup=menu + aria-expanded(open に追従)+ aria-controls(メニューの id)。ポップアップは role=menu、各項目は role=menuitem。キーは web-keys.rules.json の arrows.menu(RFC 0008)。
- 配線は双方向。トリガーからメニューへは aria-controls、メニューからトリガーへは aria-labelledby(menu 容器がトリガーの id を指し、どのトリガーに属すかを支援技術へ伝える。APG menu button の正準実装)。
- 項目の description(副文)は menuitem の accessible name に label と連結して読まれる(補足は名前の一部。aria-describedby で分離しない — 初版の決定。分離が要る事由が立てば将来 RFC)。
- 中への移動は実 DOM フォーカスの roving(overlay.md §4 の二形態のうち Menu 側。role=menuitem を実フォーカスする。Select / Combobox の listbox が DOM フォーカスをトリガーに留めて aria-activedescendant で仮想的に指すのと対を成す)。開くと先頭 menuitem(ArrowUp なら末尾)へ実フォーカスする。
- activate は Enter と Space の両方(APG menu。listbox が Enter のみで Space を type-ahead に割いたのと異なる — menuitem は活性化が主で Space も活性化に割く。web-keys arrows.menu)。活性化するとメニューを閉じ、フォーカスをトリガーへ戻す。Escape も閉じてトリガーへ戻す。
- disabled の menuitem は roving を飛ばし、aria-disabled で伝える(活性化しない。state.md §5)。
- 開閉(open)を prop に持たないのは書き落としではない。Menu は Popover を合成してコンポーネント内部が open を所有する(overlay.md §6: Select / Tooltip と同じく開閉をアプリに管理させるのは実用に反する)。open は値であって契約の面(prop)に現れない。
- トリガーを Menu が所有するのは a11y の保証のため(RFC 0008)。ARIA の配線を消費者の任意要素へ委ねると穴が生じうる。Button が閉じた契約(rest を転送しない)であることとも整合する。自前トリガーが要るときは Popover プリミティブ + arrows.menu を消費者が合成する(第4条の逃げ道)。
- 標的の門: size.md §4。

### Popover(契約 0.0.0-alpha.0)

アンカー従属の一時面プリミティブ(overlay の popover 類)。Menu / Select(pointer 経路)/ Combobox が合成する再利用の器。開閉・退出(light)・フォーカスの移動と返却・アンカーへの位置決めを担い、中身と役割(role)は消費者が与える。RFC 0007 で最初のオーバーレイ契約として新設(overlay.md §8。当初 Dialog を想定したが Select のカスタム化で先になった)。振る舞いの正は overlay.rules.json、層/描画は layering/elevation、出入りの速さは motion。

props:

- `open`: boolean(既定 false) — 開いているか。値であって状態ではない(overlay.md §6。intent を差し替えずチャンネルを奪わない)。生の Popover の所有はアプリだが、消費者(Select / Tooltip)は内部所有に変えてよい(overlay.md §6: 誰が所有するかは各契約が定める)。
- `placement`: "block-end" | "block-start"(既定 "block-end") — アンカーに対する優先の開き方向(論理方向。layout.md §7)。block-end は下、block-start は上。画面端での反転・ずらし(衝突回避)は Expressive(overlay.md §5)。Normative なのはアンカーへの帰属が読めることまで。

events(Svelte では callback prop):

- `onopenchange`: (payload: boolean) => void — 開閉の要求を伝える。light dismiss(外側 pointerdown / Escape / フォーカスの外への移動。overlay.rules.json の dismiss.web)は false を発火する。所有者(アプリまたは消費者)が open を更新する。open を値として扱う結線(overlay.md §6)。

slots(Svelte では snippet。default は子要素をそのまま):

- `anchor`(必須) — トリガー。Popover はこれに従属して位置を決め、aria-expanded / aria-controls をここへ配線する。中身(button / combobox 等)と role は消費者が与える。
- `content`(必須) — 浮かぶ面の中身。role(listbox / menu 等)は消費者が与える。Popover は面(elevation.popover)・角(shape.popover)・層(layer.popover)・出入り(motion.entrance/exit)を着せる。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- Popover 自身は role を課さない。トリガーの role(combobox / button)と中身の role(listbox / menu)は消費者が与える(overlay.md §7)。
- 配線: トリガーに aria-expanded(open に追従)、aria-controls(content の id)。フォーカスは overlay.rules.json の focus.interactiveEntersOrVirtual(対話的なら DOM か仮想=activedescendant で中へ、捕捉せず、閉じたらトリガーへ戻す。トリガー消失時は $orphanReturn)。
- 退出は light(overlay.rules.json の dismiss)。Escape は最上位の1枚だけ(後入れ先出し。overlay.md §3)。
- アンカーのスクロールに追従する(overlay.md §5。位置再計算は Expressive)。
- focusRing:false は Popover 自身が焦点を持たないため。トリガーの focus-ring は anchor スロットの中身(消費者)が持つ。

### Radio(契約 0.0.0-alpha.1)

RadioGroup の項目。単体では使えない(グループの外に単一選択は存在しない。React Aria は例外を投げ、Radix は単体を公開しない。Ant だけが単体 checked を許すが採らない — field.md §5)。選ばれているかはグループの value との一致から導かれ、checked という prop は持たない(導出値は prop ではない)。

props:

- `value`: string — この項目の識別子。グループの value がこれと一致するとき選ばれている。native の <input type=radio> の value 属性と同じ観念。既定は持たない(識別子の無い選択肢は集合に立てない)。
- `disabled`: boolean(既定 false) — この項目だけの無効。グループの disabled とは独立に立てられる(state.md §3.1 / §5)。矢印キーの巡回から外れる(web-keys.rules.json arrows.radiogroup)。

slots(Svelte では snippet。default は子要素をそのまま):

- `label`(必須) — 選択肢の名前。無名は許さない(field.md §2)。リッチ内容の規則は Checkbox と同じ(field.md §6。アクセシブルネームは内容のテキストから構成し、label 内の対話要素の活性化は選択へ伝播させない)。
- `description` — この選択肢への補足(GOV.UK の item hint と同じ観念)。グループの description とは層が違う(field.md §2「グループの解剖」)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 選ばれているかは状態として届く(Web の表現は aria-checked true / false。native input[type=radio] なら無償)。
- Space で選択(web-keys.rules.json)。矢印はグループの規則(arrows.radiogroup: 移動=選択)。
- イベントを持たないのは書き落としではない。値の変化はグループの change が運ぶ(field.rules.json groupItems。機械強制あり)。押された事実だけが要る用途は現れていない。
- invalid を持たないのも同じ線: エラーは集合への判定でありグループが宣言する。グループが invalid のとき、この項目の描画に danger が降りる(実装の文脈渡し。RadioGroup 契約の expressive notes)。
- disabled は3要求すべてを満たすこと(state.md §5)。
- label は control の後ろ(論理方向)。Checkbox と同じ扱い(field.md §8)。
- 標的の門: size.md §4。

### RadioGroup(契約 0.0.0-alpha.1)

相互排他の選択肢の集合。値はグループがひとつ持つ(field.md §5。単一選択の値は集合にひとつ — React Aria / Radix / Base UI / Carbon が同じ側)。項目は Radio。グループの label は集合の名前であり(field.md §2「グループの解剖」)、error もグループに帰属する。

props:

- `name`: string((省略可)) — グループのフォーム名(native の radio が同一 name で相互排他とグループ送信を得る。field.md §5)。各 Radio へ配られ、項目は自分の name を持たない(値の所有がグループなのと同型)。Web は native の name 属性。
- `value`: string((省略可)) — 選択中の Radio の value。アプリが所有する(field.md §5)。未指定は未選択であり、契約は未選択を許す。既定選択を置くべきかは業界が割れており(GOV.UK: 誘導を避けるため置くな / NN/g: 最頻値を置け)、アプリの文脈判断である — 契約は両方を表現できる形を取る。
- `disabled`: boolean(既定 false) — グループ全体の無効。項目へ降りる(state.md §3.1 / §5 の3要求は各項目で満たされる)。
- `invalid`: boolean(既定 false) — アプリが宣言する(state.md §2)。集合への判定(未選択・不正な組み合わせ)であり、特定の項目に帰属しない(field.md §2「グループの解剖」)。intent の danger 差し替え(state.md §7)は項目の描画へ実装の文脈で降りる。
- `required`: boolean(既定 false) — いずれかの選択が必須。支援技術に届くことは Normative、視覚標示はグループの label に部品が自動で出す(field.md §4。裁定済み 2026-07)。

events(Svelte では callback prop):

- `onchange`: (payload: string) => void — 選択が変わったことを伝える。payload は新しく選ばれた Radio の value(field.md §5)。value の更新はアプリが行う。項目は change を発火しない(グループが値を所有するため。field.rules.json の groupItems)。

slots(Svelte では snippet。default は子要素をそのまま):

- `label`(必須) — 集合の名前(Web の表現は fieldset / legend。WCAG 2.2 SC 1.3.1: グループ名が無いと「何についての質問か」が支援技術に届かない)。無名は許さない(field.md §2)。
- `description` — 集合への説明。項目の description(個々の補足)とは層が違う(field.md §2「グループの解剖」)。
- `error` — invalid のときのエラー文。グループに1つ(Carbon / GOV.UK / Polaris / Spectrum の4系統一致)。description と並置(field.md §3。裁定済み 2026-07)。
- `default`(必須) — 項目(Radio)の列。中身の構造は Radio が持ち、並べ方(縦横・間隔)はレイアウトの仕事 — グループは縦(spacing.stack)を既定とし、orientation prop は初版で持たない(第3条。横並びが要る文脈は稀で、GOV.UK は「2択かつ短いときだけ」と限定する)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- focusRing が false なのはグループ自身がフォーカスを受けないため。焦点と輪郭は項目(Radio)に立つ。
- グループ名の配線: Web の表現は fieldset / legend(H71)、または role=radiogroup + aria-labelledby。SwiftUI / Compose では見出しとグループの semantics(Compose は selectableGroup)。
- 矢印キーの規則は web-keys.rules.json の arrows.radiogroup が持つ(移動=選択、roving tabindex、disabled スキップ)。Tab はグループにひとつ: チェック済みがあればそこへ、なければ先頭へ。
- invalid はグループの状態として届き(Web の表現は radiogroup への aria-invalid + aria-describedby)、error 文はグループの説明として届く。
- 既定選択を置かない場合、Tab での進入先は先頭項目になる。未選択のまま送信された required グループが invalid の典型である。

### Reel(契約 0.0.0-alpha.0)

横に流す帯。あふれても折り返さず、流れの方向へスクロールする。折り返すのは Cluster。

props:

- `gap`: string(既定 "md") — 要素間の間隔。spacing の語彙。段(sm / md / lg)または大域の原始 X(8〜24 の整数の文字列。32px〜)。小域の原始(0〜7)は受けない(spacing.md §6: 小域は意味層で。layout.md §6)。生の px は受けない。混合型のため string であり、値の照合は実装側の適合テストの仕事。 段は spacing.inline の意味層を引く(並びの間隔)。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — 流す中身。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 見た目と意味を持たない器である。states を持たず、支援技術に構造を主張しない。意味を運ぶのは中身の仕事(layout.md §6)。
- スクロール領域はフォーカスを受け、キーボードで操作可能でなければならない(第1条)。focusRing: true がその契約である: フォーカス可能である以上、リング(focus-ring.md)が必須になる。機構の無い規範を notes だけに書かない(Badge の label で学んだ形)。
- スクロールのキー(矢印等)は role の活性化キーとは別の語彙であり、web-keys の $notYet(Collection)と同じ器で必要になったら扱う。role は立てない(スクロール領域の意味づけは Web の表現)。

### Select(契約 0.0.0-alpha.1)

閉じた選択肢の集合からひとつ選ぶ入力。選択肢を畳んで見せる(全選択肢を見せるなら RadioGroup。GOV.UK は「公開サービスでは最後の手段」とまで言う — 少数の選択肢は Radio が原則)。Web の実装は二経路(RFC 0007 の B2): touch では native select、pointer ではカスタムの popover-listbox(Popover を合成。overlay の popover 類)。リッチな選択肢(アイコン・副文)は pointer で描き、native では name へ優雅に劣化する。検索付き(Combobox)・複数選択は別部品の関心であり本契約は持たない。alpha.0(native select 基盤のみ)からの破壊的変更(RFC 0007。GOVERNANCE §3 の CHANGELOG が記録を担う)。

props:

- `name`: string((省略可)) — フォーム内でのフィールド名(native の <form> 送信・FormData・reset に参加。field.md §5)。pointer 経路は combobox が button で送信対象にならないため、value をミラーする隠し input(または ElementInternals)で参加を補う。touch 経路は native select が name をそのまま持つ。Web は native の name 属性。
- `value`: string(既定 "") — 選択中の選択肢の value。空文字は未選択。アプリが所有する(field.md §5)。
- `options`: array — 選択肢の列。データとして渡す(裁定: native select は文字列 label のみ。リッチは name/文字列駆動の追加欄で、任意内容の option は範囲外・将来 RFC。Select.md §3 / RFC 0007)。
- `placeholder`: string((省略可)) — 未選択時の表示文。label の代替ではない(field.md §2)。Web の表現は「無効化された未選択の先頭 option」(選ばれ得ない)。
- `disabled`: boolean(既定 false) — state.md §3.1 / §5。
- `invalid`: boolean(既定 false) — アプリが宣言する(state.md §2)。intent を danger へ差し替える(state.md §7)。
- `required`: boolean(既定 false) — 選択が必須(placeholder のまま送信させない)。支援技術に届くことは Normative、視覚標示は部品が自動で出す(field.md §4。裁定済み 2026-07)。
- `size`: "sm" | "md" | "lg"(既定 "md") — 寸法。size.md §2 の3段(TextField と同じ)。

events(Svelte では callback prop):

- `onchange`: (payload: string) => void — 選択が変わったことを伝える。payload は新しい value(field.md §5)。選択肢を選ぶ操作は離散であり、逐次と確定の区別が生じない。change でのページ遷移や送信を実装・アプリが仕込んではならない(WCAG 2.2 SC 3.2.2 On Input。キーボードの探索中に発火して誤遷移する — 2026-07 調査の一致)。

slots(Svelte では snippet。default は子要素をそのまま):

- `label`(必須) — 名前。無名は許さない(field.md §2)。8種と同じ slot 形状(field.md §6)。
- `description` — 説明。field.md §2。
- `error` — invalid のときのエラー文。description と並置(field.md §3。裁定済み 2026-07)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- role が combobox なのは HTML-AAM の写像に一致させたため: native の select(単一選択)は combobox role に写る。pointer 経路のカスタムも select-only combobox として同じ role に落ちる。listbox はポップアップ側の role であり本体ではない。
- 二経路の a11y(RFC 0007 の B2)。touch: native select がキーボード・SR・高コントラストを UA 水準で満たす。pointer: APG の select-only combobox パターンを自前で満たす — トリガー role=combobox に aria-expanded / aria-controls、ポップアップ role=listbox、各項目 role=option に aria-selected、現在項目は aria-activedescendant(DOM focus はトリガー据置。overlay.md §4 の仮想 focus)。キーは web-keys.rules.json の arrows.listbox。
- 開閉(open)を prop に持たないのは書き落としではない。touch は native select で開閉を UA が所有し、pointer は Popover を合成してコンポーネント内部が所有する(overlay.md §6: Select の開閉をアプリに管理させるのは実用に反する。Tooltip と同じ)。どちらも open は値であって(overlay.md §6)、契約の面(prop)には現れない。以前ここには「native select は開閉をブラウザが所有し、open を書けば native 実装が契約を満たせない」とだけ記していた(prior/superseded: RFC 0007 で pointer 経路が加わり、内部所有の open が現れた)。
- options のグルーピング(optgroup)は初版で持たない。必要の立証後に options の構造拡張で足す(破壊的でない)。
- invalid / required / disabled の配線は TextField と同じ(aria-invalid / required / state.md §5 の3要求)。
- touch では OS のネイティブピッカーが開くことが利点である(2026-07 調査: 専門家の一致。第1条の便益を B2 が touch で温存する)。ピッカーの見た目は UA / OS のものであり Stemcell は関与しない。pointer では見た目を Stemcell が握る代わりに、a11y を自前で満たす責を負う。
- リッチ選択肢(icon / description)は pointer でのみ描く。名前(label)はどちらの経路でも支援技術へ届き、icon は装飾・description は補助なので、native への劣化で意味は失われない(第2条: 同じ意味・現地の声)。
- 標的の門: size.md §4。

### Sidebar(契約 0.0.0-alpha.3)

2カラム。脇(sidebar)は内容幅で立ち、本体は fill。本体の幅が contentMin を割ったら縦積みへ折れる。

props:

- `side`: "start" | "end"(既定 "start") — 脇をどちらに置くか。論理方向(RTL で反転。Button の start/end と同じ線)。
- `sideWidth`: "8rem" | "12rem" | "16rem" | "20rem" | "24rem" | "32rem"((省略可)) — 脇の幅。閉じた6段(裁定 2026-07。Grid min と共有。単位 rem。layout.md §9)。省略時は脇の内容幅(intrinsic)。gap と違い純粋な閉集合なので enum で表現する(layout.md §6)。生の px は書かない。
- `contentMin`: string(既定 "50%") — 本体が保つ最小比率。これを割ると縦積みへ折れる(切替の条件は本体の窮屈さであって画面幅ではない。コンテナ方針)。百分率の文字列。
- `gap`: string(既定 "md") — 2カラム間(折れたら縦)の間隔。spacing の語彙。段(sm / md / lg)または大域の原始 X(8〜24 の整数の文字列。32px〜)。小域の原始(0〜7)は受けない(spacing.md §6: 小域は意味層で。layout.md §6)。生の px は受けない。混合型のため string であり、値の照合は実装側の適合テストの仕事。

slots(Svelte では snippet。default は子要素をそのまま):

- `aside`(必須) — 脇の中身(ナビゲーション等)。以前の名は side だった。prop の side(start / end)と同名で、slot を snippet / 関数引数として受けるプラットフォーム(Svelte / Compose / SwiftUI)では宣言不能になるため改名した(GOVERNANCE §4 の名前空間規則。2026-07)。
- `default`(必須) — 本体。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 見た目と意味を持たない器である。states を持たず、focus を受けず、支援技術に構造を主張しない。意味を運ぶのは中身の仕事(layout.md §6)。
- DOM / 読み上げ順は常に視覚順と一致させる: side が DOM 順も決め(start = 脇→本体、end = 本体→脇)、視覚順だけを CSS(order / row-reverse 等)で入れ替えてはならない(WCAG 1.3.2 Meaningful Sequence)。折れたときは同じ DOM 順のまま縦に積むので、折返しで読み上げ順は変わらない。

### Skeleton(契約 0.0.0-alpha.0)

読み込み中の内容の代役。来るものの形を先に置いて、レイアウトの跳ねを防ぐ。

props:

- `form`: "text" | "box" | "circle"(既定 "text") — 何を模するか。text は文字行(高さは周囲の font に従う。角は tag)、box は面(器いっぱい。角は card)、circle は円(器いっぱいの正円。角は pill)。prop 名の経緯と業界対応は Skeleton.md §2。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 支援技術から常に隠す。代役は情報ではなく、読み込み中であることは領域の側が伝える(aria-busy 相当は Skeleton を包む領域の関心。Skeleton 自身が「読み込み中」を連呼しない)。
- reduced-motion では shimmer を停止し、静止した面になる(motion.md §6 の loop 特例)。
- 相互作用しない。当たり判定の門の対象外。

### Slider(契約 0.0.0-alpha.2)

範囲の中から値をひとつ、位置で選ぶ入力。おおよその値で足りる場面のための部品であり、正確な値が要るなら数値入力を使うか併設する(NN/g / Baymard の実証が一致。Slider.md §1)。二値(range)は初版で持たない(Slider.md §2)。GOV.UK が Slider を提供しない理由(ドラッグ依存)は、本契約では WCAG 2.5.7 の要求を Normative に持つことで応える。

props:

- `value`: number — 現在値。アプリが所有する(field.md §5)。min..max に収まる。既定は持たない(基準の無い初期位置は嘘の既定になる。アプリが必ず与える)。
- `name`: string((省略可)) — フォーム内でのフィールド名(native の <form> 送信・FormData・reset に参加。field.md §5)。controlled の value と両立する非破壊の上乗せ。Web は native の name 属性。
- `min`: number(既定 0) — 下限。
- `max`: number(既定 100) — 上限。
- `step`: number(既定 1) — 刻み幅。値そのもの(native の input[type=range] / SwiftUI の step と同じ意味論)。Compose の steps は「両端を除くノッチ数」という別の観念であり、写像は steps = (max - min) / step - 1 になる(オフバイワンの罠。2026-07 native 調査)。
- `disabled`: boolean(既定 false) — state.md §3.1 / §5。

events(Svelte では callback prop):

- `onchange`: (payload: number) => void — 値が変わったことを伝える。逐次であり、ドラッグ中も発火する(field.md §5)。payload は新しい値。逐次値はプレビューの用途(表示の追従・軽い副作用)。
- `onchangeEnd`: (payload: number) => void — 操作の一続き(ドラッグ・キー操作の列)が終わったことを伝える。payload は確定値。field.md §5 の例外(裁定済み 2026-07): ジェスチャーの解放は全プラットフォームにある観念で、SwiftUI(onEditingChanged false)/ Compose(onValueChangeFinished)/ Web 4系統(onChangeEnd / onValueCommit / onValueCommitted / onChangeComplete)の6/6が分離している。重い副作用(API 呼び出し・履歴)はこちらに掛ける。

slots(Svelte では snippet。default は子要素をそのまま):

- `label`(必須) — 名前。無名は許さない(field.md §2)。
- `description` — 説明。field.md §2。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- ドラッグだけで操作できてはならない(WCAG 2.2 SC 2.5.7 Dragging Movements。カスタムスライダーの典型的失敗 F108)。キーボード(web-keys.rules.json arrows.slider: 矢印 / Home / End / PageUp / PageDown)と、トラック上の単一ポインタ操作(クリック / タップで値設定)の両方が必須である。
- 値は名前・範囲とともに届く(Web の表現は aria-valuenow / aria-valuemin / aria-valuemax)。値が数のままでは人に伝わらない場合(曜日・段階名)の読み上げ整形(aria-valuetext 相当)は、値の意味をアプリしか知らないため契約の未決に残す(field.md §8)。
- invalid / error を持たないのは部分集合の選択である(state.md §4。Switch と同じ形): 値は min..max に構造的に収まり、「不正な値」が生じる余地が薄い。React Aria / Radix / Ant / M3 Web も Slider にエラーを持たせない(4/7 多数派。反例: Base UI / Carbon / Polaris は持つ)。
- disabled は3要求すべてを満たすこと(state.md §5)。
- サムの標的は size.md §4 の門(見た目のサムが小さくても当たり判定は下限を割らない)。トラックのドラッグとページスクロールの干渉(タッチ)は実装の検証項目。
- サムの標的(size.md §4)は見た目の径と別である。サムを小さく描いても、当たり判定は Web の下限 24px を割らない(size.rules.json の hit-region)。当たりを広げると隣接要素との間隔条件(SC 2.5.8)にかかるので、レンダリングして測る(size.md §6)。

### Sources(契約 0.0.0-alpha.1)

回答の根拠(出典)の集合を一枚に集めて見せる有機体。各出典が支援技術とキーボードから到達可能で(source §2)、本文内の引用と出典の対応(citation ↔ source の相互参照)が支援技術に届く形で並べる(source §5)。conversation §3 の source part(型付き part。裁定 2026-07-24)の上に乗る。形(本文内引用 inline citation か末尾の出典リスト sources list か・折りたたみか常時表示か・番号/チップ/脚注の造形)は各実装の選択で Expressive(source §3 / §6)。各出典の中身の最小形(url / タイトル / 帰属者)は foundation で未決のため(source §8)、item をスキーマで固定せず slot に委ね、契約が縛るのは到達性と相互参照だけである。何を根拠に選ぶか(検索 / RAG / 引用生成)には触れない(source §1)。合成: 出典への遷移は Link、題や抜粋は Text。引用番号の印は Badge でない(Badge の count は量の報告で、押せない印である。引用番号は順序の識別子で、多くは押して出典へ飛ぶ。造形は Expressive)。RFC 0014 の seed(status: draft)。native 写像の一次確認まで暫定。

slots(Svelte では snippet。default は子要素をそのまま):

- `label` — 出典の集まりの領域名(「出典」「参照した情報源」等)。領域に名前があると支援技術の利用者が何のリストかを掴める。必須にはしない: source §2 の Normative の床は各出典のアクセシブルネームが届くこと(領域名ではない)であり、領域名を必須化すると foundation に無い要求を新設することになる。名前を持つときの機構は表現(Web の aria-labelledby、SwiftUI / Compose の見出しと semantics)。
- `default`(必須) — 出典項目の列。ここへ差すのは各項目の中身であって、項目の器ではない: 器(list item 相当)は Sources が持つ(裁定 2026-07-25。a11y notes)。中身の構造(到達手段への Link・題や抜粋の Text・引用番号)は foundation で最小形が未決のため(source §8)、ここで prop スキーマに固定しない。Normative なのは各項目が到達可能で(§2)、その項目が source の持つ相互参照キーを帯びること(a11y notes)までである。並べ方(縦の間隔・区切り)はレイアウトの仕事で、リストは縦(spacing.stack)を既定とする。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- リストの構造は Sources が持つ(裁定 2026-07-25)。role=list を名乗る以上、その中に list item 相当の項目が並ぶことを器が保証する。アプリが差すのは各項目の中身だけで、項目の器を自分で用意する必要はない。アプリ側の作法に頼ると、守られなかったとき「項目が0件のリスト」として支援技術に届き、しかも機械検査で捕まえられない(守れない約束を増やさない)。機構は表現(Web は ul と li 相当、SwiftUI と Compose は各々のリストの semantics)。中身をどう受け取るか(項目ごとのスロット・スニペット・配列)も各実装の表現である。
- 各出典への到達手段(引用・出典リンク)が支援技術とキーボードから到達可能であること(source §2。第1条の信頼に直結する)。到達の機構は表現(Web の <a> / aria、SwiftUI の Link / link trait、Compose の semantics)で、遷移そのものは合成した Link の契約が持つ。フォーカスとフォーカスリングは Link に立ち、リスト自身は focus を受けない(focusRing: false)。
- 本文内の引用と、その出典の実体(リスト項目)の対応(cross-reference)が支援技術に届くこと(source §2 / §5)。これが本契約の要で、単なるラベルより一段強い構造的な相互参照である。相互参照キー(id)は UI が採番せず、source が持つ値を使う(source §3。裁定 2026-07-25。事実標準では採番がデータ側から降りてくる)。各出典項目はその id を帯び、本文内の引用の印は同じ id を参照する。機構は表現で、SwiftUI は専用 API(accessibilityLinkedGroup(id:in:))で離れた2要素を AT のナビゲーションで結ぶ(一次確認済み: 「アクセシビリティ階層上で近くにない要素どうしでも、素早く行き来できるように結ぶ」。iOS 14.0+)。Web と Compose の機構は各実装が選ぶ(source §7)。Web で aria-details を単独の手段にしない: 支援技術の対応が薄く、仕様の解説も唯一の伝達手段にするなと述べている。実際に届く形(出典へ飛べるリンクと、対応が分かるアクセシブルネーム)を優先する。Compose に相互参照専用 API があるかは foundation の native 一次確認が残る論点で(source §7 / §8)、実現手段に成熟度差がありうる。
- 相互参照の一方の端(本文内の引用の印)は、本文(text part)の描画の中に置かれる。その造形(番号 / チップ / 脚注)と本文中の配置は Expressive で(source §6)、本組織はリスト側の端を持つ。両端はどちらも source が持つ id を参照するだけで、どちらの側も採番しない(source §3)。本文側の端の配線は、会話への埋め込みを扱う有機体 / パターン(未起草)で本契約と両側から確認する(Sources.md §5)。
- どこからの情報かを視覚だけに頼らない(WCAG 1.4.1 の同型。番号や色だけでなく出典のアクセシブルネームが届く。source §2)。各出典は名前を持ち、無名の出典を許さない(第1条。Dialog の title・Icon の label と同型)。
- 項目内に押せる要素(出典リンク等)があれば、focus とフォーカスリングと当たり判定の門(size.md §4)はその要素に生きる。ルートの focusRing: false は Sources 自身が focus を受けないという意味で、内部の Link を免除しない。項目ごとの相互参照キーや条件付き部分要素の a11y をスキーマは表現できない(Tag / Alert / ToolCall と同じ限界の認識)。同型の契約が増えたら表現をスキーマで扱う。
- 誤りの可能性の告知(免責)は本組織の関心でない。source foundation がこれを扱うか会話全体の別の関心として切るかが未決のため(source §4 / §8)、先取りしない。告知の文言は DS 所有文字列で i18n の対象(source §9)。

### Stack(契約 0.0.0-alpha.0)

縦または横の並び。間隔を所有する(layout.md §1: 中身は外側 margin を持たない)。

props:

- `direction`: "stack" | "inline"(既定 "stack") — 並びの流れ。stack は積み(横書きでは縦)、inline は並び(同・横)。Divider の orientation と同じ論理方向の語彙(spacing.md §4)。
- `gap`: string(既定 "md") — 要素間の間隔。spacing の語彙。段(sm / md / lg)または大域の原始 X(8〜24 の整数の文字列。32px〜)。小域の原始(0〜7)は受けない(spacing.md §6: 小域は意味層で。layout.md §6)。生の px は受けない。混合型のため string であり、値の照合は実装側の適合テストの仕事。 段は direction に応じて spacing.stack / spacing.inline の意味層を引く。
- `align`: "stretch" | "start" | "center" | "end"(既定 "stretch") — 交差軸の揃え。既定 stretch は「内容は交差軸方向にいっぱいに広がろうとする」という既定(第3条の一般原理の flex 版。direction=stack なら横いっぱい、inline なら縦いっぱい)。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — 並べる中身。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 見た目と意味を持たない器である。states を持たず、focus を受けず、支援技術に構造を主張しない。意味を運ぶのは中身の仕事(layout.md §6)。

### StemcellProvider(契約 0.0.0-alpha.1)

アプリの文脈軸が確立される一点(第6条)。トークンを配らず、各プラットフォームの環境機構に軸を立てる。Web では DOM を出さない副作用、native ではラッパー(StemcellProvider.md §1 / §8)。状態を持たない: テーマの所有・永続化はアプリの仕事であり、Provider は受け取った値で軸を立てるだけ(§5)。

props:

- `theme`: string(既定 "auto") — テーマ名。auto(既定)は OS のカラースキームに追従し、Web では属性を付けないこと自体が auto である(StemcellProvider.md §4)。組み込みは standard-light / standard-dark。themes で登録したカスタムテーマの key も指せるため、値集合は閉じておらず enum ではない。
- `density`: "comfortable" | "compact"(既定 "comfortable") — 密度。文脈の軸なので、これを受け取るのは Provider だけである(第6条)。決定主体と切替 UI の扱いは spacing.md §5「密度の決定主体」。Web にしか存在しない(ceded 参照)。
- `themes`: array((省略可)) — カスタムテーマの登録。消費者が上書きできるのは列挙した事項(色)だけである(第3条・rfc 0003)。任意のトークン木は受けない(StemcellProvider.md §7 の型強制。この fields が閉じていることがその機械可読な形である)。
  - 注意: この Svelte 実装では未実装。渡すと warn して無視する(HOLES #5。仕様側の変換ユーティリティの置き場が未決)

### Switch(契約 0.0.0-alpha.1)

独立した設定の on / off。即時反映し、保存・送信を要しない(field.md §7 の線引き。裁定済み 2026-07)。invalid / indeterminate / required を持たないのは部分集合の選択である(state.md §4)。エラーを出したい Switch は Checkbox であるべき兆候。

props:

- `name`: string((省略可)) — フォーム内でのフィールド名(native の <form> 送信・FormData・reset に参加。field.md §5)。controlled の checked と両立する非破壊の上乗せ。Web は native の name 属性(checked のとき値が送信に載る)。
- `checked`: boolean(既定 false) — 値であって状態ではない(state.md §6)。アプリが所有する。語彙は Checkbox と同一(field.md §7: 業界は同一 DS 内でも checked / selected / toggled と割れているが、Stemcell は checked に統一する。第2条)。
- `disabled`: boolean(既定 false) — state.md §3.1 / §5。

events(Svelte では callback prop):

- `onchange`: (payload: boolean) => void — 切替が起きたことを伝える。payload は新しい checked(field.md §5。裁定済み 2026-07)。即時反映が前提: アプリは change を受けて設定をその場で適用する。適用に確定ステップが要るなら、この部品の選択が誤りである(field.md §7)。

slots(Svelte では snippet。default は子要素をそのまま):

- `label`(必須) — 名前。無名は許さない(field.md §2。反面教師: M3 の Web 実装は Switch が label を持たず常に別配線を要求する)。
- `description` — 説明。支援技術に説明として届く(field.md §2)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- on / off が状態として届く(Web の表現は aria-checked true / false。switch role の aria-checked は真偽値のみで mixed を持たない — indeterminate を持たない契約と整合)。
- Space で切り替わる(web-keys.rules.json。native に switch 要素は無く、Web の標準パターンは native checkbox を土台に role=switch を載せる形なので、土台の挙動に一致させる)。
- disabled は3要求すべてを満たすこと(state.md §5)。
- 適用に時間がかかるときの伝達は aria-busy の領域(state.md §6 の loading)であり、本契約は持たない。要る部品が現れたら自分の契約で定義する。
- label は control の後ろ(論理方向)。Checkbox と同じ扱い(field.md §8)。
- 標的の門: size.md §4。

### Switcher(契約 0.0.0-alpha.1)

器の幅が閾値を下回ったら、横並び全体が縦へ一斉に切り替わる。項目ごとに流れるのは Cluster。切替は閾値駆動が Normative(裁定): 同じ幅なら同じ形。内容駆動(収まらなくなったら切替)は採らない。

props:

- `threshold`: string(既定 "30rem") — 切替の閾値(器の幅がこれ未満で縦)。rem の長さの文字列。単位は rem と裁定済み(2026-07): 「同じ幅」は本文相対で定義する(経緯と実測は layout.md §9)。rem 以外の単位と生の px は受けない。値語彙(許す数値の集合)は未確定で、Grid の min と同じ問題を共有する(layout.md §9)。
- `gap`: string(既定 "md") — 要素間の間隔(両方向)。spacing の語彙。段(sm / md / lg)または大域の原始 X(8〜24 の整数の文字列。32px〜)。小域の原始(0〜7)は受けない(spacing.md §6: 小域は意味層で。layout.md §6)。生の px は受けない。混合型のため string であり、値の照合は実装側の適合テストの仕事。 段は spacing.gap の意味層を引く。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — 並べる中身。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 見た目と意味を持たない器である。states を持たず、focus を受けず、支援技術に構造を主張しない。意味を運ぶのは中身の仕事(layout.md §6)。
- 切替で DOM / 読み上げ順は変わらない。
- SwiftUI 実装は ViewThatFits を使わない: あれは内容駆動(収まりで切替)であり、同じ幅でも内容次第で形が割れて共通言語が壊れる(layout.md §9 の記録)。自前で幅を測って閾値と比べる。

### Tag(契約 0.0.0-alpha.2)

分類の名札。ものに貼られ、集めると絞り込みの語彙になる。静的にも、選べる形(selected)にも、消せる形(dismissible)にもなる(裁定: 選択を初版に含める)。

props:

- `variant`: "soft" | "outlined"(既定 "soft") — 常時そこにあってよい重さだけを採る(emphasis.md §3 の部分集合)。filled の名札は注意を奪う: 印(Badge)との役割分担。
- `size`: "sm" | "md"(既定 "md") — size.md §2 の部分集合。lg の名札は名札ではなくボタンに見える。
- `dismissible`: boolean(既定 false) — 消せる名札。閉じる操作の見た目は部品内部(IconButton 相当)だが、公開 API はこの boolean と dismiss イベントだけ。
- `selected`: boolean((省略可)) — 値であって状態ではない(state.md §6)。選択の所有はアプリ: click を受けてアプリが selected を更新する。この prop が与えられた Tag は選べる名札(絞り込み)として振る舞う。
- `disabled`: boolean(既定 false) — 相互作用がある形(selected / dismissible)でのみ意味を持つ。state.md §3.1 / §5。

events(Svelte では callback prop):

- `onclick`: (payload: void) => void — 選べる名札が押されたことを伝える。選択の切替はアプリが selected を更新して起こす。静的な Tag(selected も dismissible も無い)は発火しない。
- `ondismiss`: (payload: void) => void — 消す操作。取り除くのはアプリ(Tag は自分を消さない。リストの所有者が消す)。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — ラベル。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- role は相互作用がある形(selected / dismissible)のときの意味論。静的な Tag は操作対象ではなく、role を立てない(Web の表現)。この「条件付きの相互作用」は契約スキーマの想定(常に持つ/常に持たない)の外にあり、機械検査は区別できない。スキーマの限界として認識し、同型の契約が増えたら表現をスキーマで扱う(Tag.md §5)。
- 選択の伝達(aria-pressed か aria-selected か)は Web の表現であり、単体の選べる名札は押下トグル、集合(絞り込みグループ)での選択は Collection の語彙(クラスタ7)で再訪する。
- states は相互作用がある形でのみ現れる。静的な Tag はホバーに応えない: 押せないものに反応を返すのは嘘である(state.md §3.2 と同じ第1条)。
- dismissible と selected が同居するとき、ルートを単一の対話要素にしない。対話要素の入れ子(role=button の中に押せる×)は WAI-ARIA の既知のアンチパターンであり、選択領域と削除領域は同じ階層の兄弟として構成する(MUI Chip が同じ構造で長年の a11y issue を抱えている)。フォーカス順は本体(選択)→ ×(削除)。× のアクセシブルネームは「{ラベル} を削除」の形で合成する(合成の言語表現は各実装)。
- 相互作用がある形は当たり判定の門(size.md §4)の対象。sm の名札でも判定は 24px を割らず、本体と × の判定の重なりは SC 2.5.8 の間隔条件(size.md §4.4)にかかる。

### Text(契約 0.0.0-alpha.0)

content に typography 役割を当てる原始。typography.md の役割語彙(display/headline/title/body/label/mono ×L/M/S)を、アプリが書く見出し・本文・キャプションへ当てる消費者 API。Box/Stack が layout の原始であるのと同じ位置の typography 版。視覚の役割(variant)は普遍だが、a11y の意味要素(見出しの階層・段落)は各プラットフォームの表現であり、Web では要素(as)で与える。両者は分離する: variant が意味要素を含意すると、同じ見た目の役割を別の階層で使った瞬間に見出し構造が壊れる。

props:

- `variant`: "display-lg" | "display-md" | "headline-lg" | "headline-md" | "headline-sm" | "title-lg" | "title-md" | "title-sm" | "body-lg" | "body-md" | "body-sm" | "label-lg" | "label-md" | "label-sm" | "mono-md" | "mono-sm"(既定 "body-md") — typography の合成役割(typography.md §4)。値は実在する16トークンに1:1で写り、display-sm / mono-lg のような役割とサイズの無効な組は列挙に存在しない(役割×サイズは完全な格子ではない)。variant を予約 prop に使うのは、これが Text を統べる foundation(typography)の変種軸だからである。予約 prop variant の許容値は、その部品が統べる foundation から来る: tokenBinding が指すトークン群の成員(ここでは typography の役割)で、tokenBinding を持たない variant は既定で emphasis(filled/soft/outlined/text)に束ねられる(GOVERNANCE §6-1。RFC 0012。裁定 2026-07-23)。
- `truncate`: boolean(既定 false) — はみ出す文字を1行で省略する(末尾を切り、省略記号で示す)。視覚の省略であり、全文は DOM に残って支援技術へ届く(切るのは見た目だけ)。複数行のクランプは初版に含めない(必要が立証されたら足す)。
- `muted`: boolean(既定 false) — 副次の文字色(app.fg-muted)へ落とす。既定(false)は色を宣言せず周囲を継承する(StemcellProvider が地の本文色 app.foreground を敷く)。fg-subtle 等のさらなる段が要ると立証されたら、boolean を tone 列挙へ広げる(Text.md §5)。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — 文字の内容。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 視覚の役割(variant)と a11y の意味要素は分離する。variant は見た目(サイズ・weight・字間)だけを決め、見出しの階層(h1..h6)や段落・インラインの意味は与えない。同じ title-lg を主見出しにも小見出しにも使えるが、階層の正しさは意味要素の側(Web では as)が担う。混ぜると『大きい文字＝見出し』の誤りで構造が壊れる。
- 意味要素は各プラットフォームの a11y 表現である。Web では要素(as: h1..h6 / p / span 等)で与える。既定は中立のインライン(span 相当)で、構造を主張しない。見出し階層の管理(h1 は1つ、飛ばさない)はアプリの責務で、Text は水準を自動で管理しない(将来 Heading 相当の薄い器を検討する余地。Text.md §5)。
- truncate は視覚だけの省略で、要素の文字内容は全文のまま残る(text-overflow の実務: DOM のテキストは完全で、支援技術は全文を読む)。省略された全文を別途 title 属性等で見せるかは実装の表現。
- Text は相互作用しない。role を持たず、フォーカスを受けない(意味要素が持つ既定の意味論だけが残る)。

### TextField(契約 0.0.0-alpha.2)

1行のテキスト入力。label / description / error を内包する複合フィールド(README の命名根拠)。解剖は foundations/field.md §2、値とイベントは同 §5(change 1本。裁定済み 2026-07)。8種の語彙の基準器: label の技術形状(slot)はここで決まり、Checkbox のリッチ label が検算する(field.md §6)。

props:

- `name`: string((省略可)) — フォーム内でのフィールド名(native の <form> 送信・FormData・reset に参加。field.md §5)。controlled の value と両立する非破壊の上乗せ。Web は native の name 属性。
- `value`: string(既定 "") — 現在値。アプリが所有する(field.md §5: SwiftUI の Binding も Compose の value+onValueChange も単方向で、Web の controlled と同型)。部品は change で新しい値を通知するだけで、自分では保持しない。uncontrolled は土地の便宜であり契約外。
- `placeholder`: string((省略可)) — 入力例のヒント。label の代替ではない(field.md §2: 入力した瞬間に消える名前は、名前ではない)。
- `disabled`: boolean(既定 false) — state.md §3.1 / §5。3要求(活性化しない / interaction の状態が現れない / 支援技術から到達でき無効と伝わる)。
- `readonly`: boolean(既定 false) — 読めるが編集できない。状態ではなく property である(state.md §6)。invalid と同時に成立しない(HTML が readonly を constraint validation から除外する)。コントラストの免除は受けない(Understanding SC 1.4.3 は disabled のみを例示)。
- `invalid`: boolean(既定 false) — アプリが宣言する(state.md §2。判定が値から来たかサーバから来たかは問わない)。intent を danger へ差し替える(state.md §7)。いつ立てるか(blur / submit / 逐次)は Stemcell が規範化しない(field.md §3「バリデーションの所有」)。
- `required`: boolean(既定 false) — 必須。支援技術に届くことは Normative、視覚標示も部品が自動で出す(field.md §4。裁定済み 2026-07。記号そのものは seed)。
- `autocomplete`: string((省略可)) — 入力目的の宣言(WCAG 2.2 SC 1.3.5 Identify Input Purpose、AA。manifest の適合宣言により必須の関心)。語彙は WHATWG Autofill のトークン(name / email / street-address 等)を正とし、native は写像できる範囲で写す(iOS の textContentType / Compose の autofill semantics。写像は一部 lossy — 第7条 Graceful Degradation)。個人情報を集める欄では省略しないこと。値域の機械検査は未整備(field.md §8)。
- `keyboard`: "text" | "email" | "numeric" | "decimal" | "tel" | "url"(既定 "text") — ソフトウェアキーボードの種類。検証ではなく入力の補助である(Web の inputmode / iOS の keyboardType / Compose の KeyboardOptions.keyboardType へ写像。6値は3プラットフォームすべてに対応物がある交差集合)。数字だが数値演算しない文字列(電話・郵便番号・カード番号)は numeric を使う。数値スピナー(type=number 相当)の意味論は持たない(2026-07 調査: その弊害は業界の一致)。
- `size`: "sm" | "md" | "lg"(既定 "md") — 寸法。size.md §2 の3段すべてを採る(Carbon / Ant / Spectrum も入力に複数段を持つ)。段が引く余白の配線は foundations/size.rules.json。

events(Svelte では callback prop):

- `onchange`: (payload: string) => void — 値が変わったことを伝える。逐次であり、payload は新しい値(field.md §5。裁定済み 2026-07)。確定(blur / Enter)のイベントは持たない: 確定型は SwiftUI にも Compose にも存在せず、中立の契約に書けば Web の慣習を全プラットフォームへ漏らす。Web 実装が確定の器を欲しければ web 規範層の仕事(field.md §8)。

slots(Svelte では snippet。default は子要素をそのまま):

- `label`(必須) — 名前。無名は許さない(field.md §2)。視覚的に隠すことは許すが、隠しても支援技術に名前が届く形が要る。slot(自由内容)である理由は field.md §6: 8種で同じ語彙であり、基準は最も要求が厳しい Checkbox のリッチ label に置く。アクセシブルネームは label の内容のテキストから構成する。
- `description` — 説明・入力条件(「8文字以上」等)。支援技術に説明として届く(field.md §2。Web の表現は aria-describedby)。
- `error` — invalid のときのエラー文。色だけで伝えない(WCAG 2.2 SC 1.4.1。field.md §3)。description と並置され、置き換えない(field.md §3。裁定済み 2026-07)。invalid が立つのに error が空であることは機械的には許されるが、何が悪いかが伝わらない。部品は invalid のときだけ error を描く(invalid=false では現れる内容を渡しても出さない。field.md §3。裁定済み 2026-07)。
- `start` — 入力に先行するアイコン・接頭辞等(裁定済み 2026-07。Button の start / end と同じ語彙。M3 の leading icon / Polaris の connected / Radix の Slot が同じ観念)。間隔は spacing.inline.md。start / end は論理方向であり RTL で反転する。
- `end` — 入力に後続するアイコン・接尾辞等。start と同じ規則。中に対話要素(クリアボタン等)を置く場合、それは自分のフォーカス順を持ち、当たり判定の門(size.md §4)にかかる。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- label の配線: 名前として届く(field.md §2)。Web の表現は label 要素との関連付け。リッチ label のアクセシブルネームは内容のテキストを平坦化して構成する(ARIA accessible name from content)。
- description と error は両方が説明として届く(field.md §3。Web の表現は aria-describedby が両方を参照)。aria-errormessage は部分サポートであり、採るなら describedby の代替ではなく併用(field.md §3「配線の実情」)。
- invalid は状態として届く(Web の表現は aria-invalid)。required は要求として届く(Web の表現は required / aria-required)。
- disabled は3要求すべてを満たすこと(foundations/state.md §5)。readonly は到達でき、読め、選択できる(state.md §6)。
- textbox は活性化のキーを持たない(web-keys.rules.json: 空配列)。操作は文字入力そのものであり、1行入力での Enter の意味(暗黙送信)は HTML のフォームの挙動であって本契約の関心ではない。
- 標的の門: 当たり判定は size.md §4 の下限を下回らない。

### Textarea(契約 0.0.0-alpha.0)

複数行のテキスト入力。TextField を継承する(props / states / tokensRequired)。別部品である理由は Textarea.md §1: SwiftUI では 1行(TextField)と複数行(TextEditor)で型そのものが変わり、boolean の multiline prop では実装の分岐を吸収できない(2026-07 native 調査)。slots / events は継承されないので再宣言する(スキーマの extends 意味論)。start / end を再宣言しないのは意図的である: 複数行の器にアイコンの行内配置は成立しない。

props:

- `name`: string((省略可)) — フォーム内でのフィールド名(native の <form> 送信・FormData・reset に参加。field.md §5)。controlled の value と両立する非破壊の上乗せ。Web は native の name 属性。
- `value`: string(既定 "") — 現在値。アプリが所有する(field.md §5: SwiftUI の Binding も Compose の value+onValueChange も単方向で、Web の controlled と同型)。部品は change で新しい値を通知するだけで、自分では保持しない。uncontrolled は土地の便宜であり契約外。
- `placeholder`: string((省略可)) — 入力例のヒント。label の代替ではない(field.md §2: 入力した瞬間に消える名前は、名前ではない)。
- `disabled`: boolean(既定 false) — state.md §3.1 / §5。3要求(活性化しない / interaction の状態が現れない / 支援技術から到達でき無効と伝わる)。
- `readonly`: boolean(既定 false) — 読めるが編集できない。状態ではなく property である(state.md §6)。invalid と同時に成立しない(HTML が readonly を constraint validation から除外する)。コントラストの免除は受けない(Understanding SC 1.4.3 は disabled のみを例示)。
- `invalid`: boolean(既定 false) — アプリが宣言する(state.md §2。判定が値から来たかサーバから来たかは問わない)。intent を danger へ差し替える(state.md §7)。いつ立てるか(blur / submit / 逐次)は Stemcell が規範化しない(field.md §3「バリデーションの所有」)。
- `required`: boolean(既定 false) — 必須。支援技術に届くことは Normative、視覚標示も部品が自動で出す(field.md §4。裁定済み 2026-07。記号そのものは seed)。
- `autocomplete`: string((省略可)) — 入力目的の宣言(WCAG 2.2 SC 1.3.5 Identify Input Purpose、AA。manifest の適合宣言により必須の関心)。語彙は WHATWG Autofill のトークン(name / email / street-address 等)を正とし、native は写像できる範囲で写す(iOS の textContentType / Compose の autofill semantics。写像は一部 lossy — 第7条 Graceful Degradation)。個人情報を集める欄では省略しないこと。値域の機械検査は未整備(field.md §8)。
- `keyboard`: "text" | "email" | "numeric" | "decimal" | "tel" | "url"(既定 "text") — ソフトウェアキーボードの種類。検証ではなく入力の補助である(Web の inputmode / iOS の keyboardType / Compose の KeyboardOptions.keyboardType へ写像。6値は3プラットフォームすべてに対応物がある交差集合)。数字だが数値演算しない文字列(電話・郵便番号・カード番号)は numeric を使う。数値スピナー(type=number 相当)の意味論は持たない(2026-07 調査: その弊害は業界の一致)。
- `size`: "sm" | "md" | "lg"(既定 "md") — 寸法。size.md §2 の3段すべてを採る(Carbon / Ant / Spectrum も入力に複数段を持つ)。段が引く余白の配線は foundations/size.rules.json。
- `rows`: number(既定 3) — 初期の行高(行数)。上限ではない。内容に応じた自動成長を既定にしない: Web の field-sizing: content は 2026-07 時点で Baseline の Widely Available 未達(Newly Available 2026-06)であり、採るなら progressive enhancement(第7条)。成長のさせ方は Expressive。

events(Svelte では callback prop):

- `onchange`: (payload: string) => void — 値が変わったことを伝える。逐次であり、payload は新しい値(field.md §5。裁定済み 2026-07)。TextField と同一定義の再宣言。複数行での改行は値の変化であり、確定ではない。

slots(Svelte では snippet。default は子要素をそのまま):

- `label`(必須) — 名前。TextField と同じ規則(field.md §2 / §6)。
- `description` — 説明・入力条件。TextField と同じ規則。
- `error` — invalid のときのエラー文。TextField と同じ規則(並置。field.md §3)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- TextField の notes がすべて当てはまる。複数行であることが支援技術に届く(Web の表現は native textarea 要素、または aria-multiline)。
- keyboard prop は継承される。Compose は複数行でも keyboardType を持つ。iOS の複数行(TextEditor)で同様に効くかは未確認である(一次情報が bot 遮断で未達、二次情報は割れている。下敷きの UITextView は UITextInputTraits に準拠し keyboardType を持つため、効く可能性がむしろ高い — 独立レビューの指摘で当初の「対応物が無い」という断定を訂正)。swiftui 実装の実験で決着する。効かないと実証された場合の器は第7条(技術の普及の時間軸)ではなく ceded(removes。GOVERNANCE §4 の構造差の器)を検討する。
- Enter は改行であり、暗黙送信は起きない(HTML の挙動。本契約の関心ではないが、TextField との違いとして記録)。

### Toast(契約 0.0.0-alpha.0)

勝手に消えてよい報告(overlay の notification 類)。その場に留まる報告は Alert の仕事。Toast は fire-and-forget の出来事で、ツリー上の置き場所に現れず、アプリが任意の場所から命令的に enqueue する(Stemcell 文脈のホストへ。RFC 0013)。呼び出しの形は各プラットフォームの表現(Compose の SnackbarHostState、SwiftUI の environment、Web の provider context)だが、召喚が命令形であること自体は notification 類の Normative(overlay.md §6 の carve-out)。生存時間と退去はホストが所有し(自律退去。Toaster / StemcellProvider が establish する)、アプリは open を値として握らない。内容は data(message は文字列)で、リッチ内容(任意マークアップ)は将来 RFC(Select の option リッチ化と同型)。フォーカスを奪わない(overlay.md §4)。単一の任意アクションを持て、アクションがあれば自律退去しない(第1条: 消える前に届く)。

props:

- `message`: string — 通知の本文。data として渡す(スロットでない): 召喚が命令形で、置き場所を持たない出来事だから(RFC 0013)。支援技術へ届く核。リッチ内容は将来 RFC。
- `color`: "danger" | "warning" | "success" | "info"(既定 "info") — 報告の intent(color.md §5)。Alert / Badge と同じ4値・同じ既定。primary / plain を含まない理由も同じ(行動の語彙を報告に使わない)。intent は割り込みの度合いにも連動する(a11y。Alert と同規範)。
- `duration`: number((省略可)) — 自律退去までの時間(ミリ秒)。省略時はホストの既定(seed)。SC 2.2.1: 調整可能で、hover / focus 中は一時停止する(a11y)。actionLabel があるときは無視され、自律退去しない(消える前にアクションへ届くため。RFC 0013)。ミリ秒は中立の時間量であり、これは motion の遷移(entrance / exit)とは別の量(motion トークンは ~150–300ms、自律退去は桁が違う)。既定値の置き場所は Toaster(overlay.md §8 の open TODO をここで閉じる)。
- `dismissible`: boolean(既定 true) — 明示的に閉じられるか。Alert(既定 false: 状況が続く限り読める)と逆で、Toast の既定は true: 一時的で自律退去する報告は、利用者が待たずに閉じられるべき(第1条)。actionLabel があり自律退去しないときも、閉じる口が利用者の逃げ道になる。
- `actionLabel`: string((省略可)) — 単一の任意アクションのラベル(Undo / Retry 等)。与えると action イベントを発火する押せる要素が現れ、その通知は自律退去しなくなる(RFC 0013。第1条: キーボード / 支援技術がアクションへ届く前に消えない)。複数アクション・アイコン付きは範囲外(将来 RFC)。

events(Svelte では callback prop):

- `ondismiss`: (payload: void) => void — 通知がホストから取り除かれたときに通知する(自律退去・明示クローズ・アクション後のいずれでも)。取り除く主体はホストであってアプリではない(Alert の dismiss はアプリが取り除く向きだったが、Toast はライフサイクルをホストが所有する。RFC 0013)。アプリはこの契機で副作用の後始末をする。
- `onaction`: (payload: void) => void — 単一アクション(actionLabel)が活性化されたことを伝える。命令形で enqueue する経路では、アプリが渡したハンドラがこのイベントに結線される。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 報告は支援技術へ割り込みの度合いつきで届く。即時の割り込み(Web の表現は role=alert 相当)は danger だけに絞り、warning / success / info は穏当な告知(role=status 相当)とする。Alert と同一の Stemcell 規範(color.md §5 / Alert.md)。Toast は常に動的に挿入されるため、この告知は必ず起きる(初期描画から在る Alert と違い、静的挿入の例外は無い)。
- フォーカスを奪わない(overlay.md §4 notification 類)。通知が現れてもフォーカスは移らない。ゆえに actionLabel / dismissible の押せる要素へポインタ無しで届くには、通知の領域がキーボードで到達可能でなければならない(領域を landmark にし、F6 相当で巡回できる。到達性はホスト = Toaster が担う。overlay.md §4 の notification 到達性)。
- 自律退去は SC 2.2.1 に従う: hover / focus 中は一時停止し、duration は調整可能(prop)。actionLabel があるときは自律退去せず、アクションが到達される前に消えない(第1条)。
- actionLabel / dismissible(閉じる)は内部の押せる要素であり、focus を受け、フォーカスリングが必須で、当たり判定の門(size.md §4)の対象。ルートの focusRing: false は Toast 自身が focus を受けないという意味で、内部要素を免除しない(条件付きで生える部分要素の a11y をスキーマは表現できない。Alert / Tag と同じ限界の認識)。リング色は既定の app.system(tokensRequired に束縛)。閉じるの名前は「閉じる」+ message から合成し、兄弟として構成する(Alert の dismiss と同規範)。
- intent の絵(先頭のアイコン)は色に頼らない識別の手がかり(WCAG 1.4.1)。絵の意味名はアイコンセット受領時に確定(iconography.md §6)。
- message は通知の内容であって Toast の名前配線(aria-labelledby 相当)はしない。内容が読み上げ順で届く領域である(Alert と同型)。

### Toaster(契約 0.0.0-alpha.0)

通知(Toast)のホスト。キュー・タイマー・自律退去のライフサイクルを所有し、隅の領域に Toast を積んで描く状態を持つユニット(RFC 0013)。子孫へ命令形の enqueue 能力を各プラットフォームの文脈 / 環境機構で提供する(Web は context、Compose は hoist した host state、SwiftUI は environment)。この enqueue 能力は props / events / slots に収まらない新種の契約表面であり、機構は表現・「文脈のルートがホストを提供し各所が環境機構で enqueue する」構造が Normative(第2条・overlay.md §6)。StemcellProvider が既定の Toaster を1つ establish するのでゼロ設定で enqueue が動く(第4条-1)。アプリが Toaster を明示的に置けば位置 / safe-area / scope を上書きできる(第4条 逃げ道)。StemcellProvider の無状態(契約 §5)は保たれる: 状態を持つのはこの Toaster であって provider ではない。

props:

- `position`: "block-start inline-start" | "block-start inline-center" | "block-start inline-end" | "block-end inline-start" | "block-end inline-center" | "block-end inline-end"(既定 "block-end inline-end") — 領域を寄せる隅(論理方向。layout.md §7。RTL / 縦書きで自動反転)。既定 block-end inline-end は seed。safe-area(ノッチ / ホームインジケータ)への内側寄せは実装が担う(第1条)。
- `max`: number(既定 3) — 同時に見せる Toast の最大数。超えた分は畳む / 待たせる(overflow の見せ方は Expressive)。既定 3 は seed。多重に積み上げて画面を埋めない(第1条 / 第3条)。
- `defaultDuration`: number(既定 5000) — Toast が duration を省いたときの既定の自律退去時間(ミリ秒)。既定 5000 は seed(overlay.md §8 の「自律退去時間の値と置き場所」をここで閉じる: 値は Toaster が持つ)。SC 2.2.1 に従い、hover / focus 中は一時停止し、個々の Toast の duration で上書きできる。actionLabel を持つ Toast はこの既定に関わらず自律退去しない(Toast 契約)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 領域は landmark にし、キーボードで到達可能にする(Web の表現は role=region + aria-label。F6 相当の巡回で入れる)。通知はフォーカスを奪わない(overlay.md §4)ので、actionLabel / 閉じるの押せる要素へポインタ無しで届く唯一の道がこの到達性である(第1条)。SwiftUI / Compose では対応する到達機構に写す。
- 領域自体は告知しない(aria-live は個々の Toast が持つ。role=status / alert は Toast 側)。領域は器であって内容ではない。
- 自律退去のタイマーは hover / focus 中は一時停止する(SC 2.2.1)。ホストがキューとタイマーを所有し、Toast の追加 / 退去 / 上限超過を決定的に扱う(svelte / lit が食い違わないため。GOVERNANCE §7)。

### ToolCall(契約 0.0.0-alpha.0)

ツール呼び出しの進行を1枚で見せる面。1つの呼び出しが busy →(result | error)を経る様を、各段階が支援技術と視覚へ届く形で描く(tool-call.md)。lifecycle は state.rules.json の相互作用状態ではないため states でなく status prop で持つ(busy は loading と同型の進行。tool-call §3)。アプリ / SDK が status を所有し駆動する(UI は与えられた段階を描くだけ。tool-call §6。Dialog の open と同じ向き)。ツールの実行・プロトコル(MCP / A2A / function-calling)・runtime には触れない(§6)。ツール名から結果描画への対応(Generative UI。§5)は result スロットの表現。承認待ち(requires-action)は必須集合外で HITL が持つ(§2)。conversation §3 の tool-call / tool-result part の上に乗る。RFC 0014 の seed(status: draft)。native 写像の一次確認まで暫定。

props:

- `status`: "busy" | "result" | "error" — 呼び出しの段階(tool-call §2 の必須集合。閉。暫定)。busy は進行中(引数の形成と実行を含む。native は内部段階を畳む)、result は完了して結果がある、error は失敗した。遷移は busy →(result | error)。states でなく prop なのは、これが state.rules.json の相互作用状態ではなく loading と同型の進行だからである(tool-call §3。発明できない相互作用状態と違い、進行はアプリが所有する値)。既定を持たない(required): status 無しのツール活動は無意味で、silent な既定は段階の主張になる。pending / running の区別は Expressive で、ここには持たない(§2)。

slots(Svelte では snippet。default は子要素をそのまま):

- `name`(必須) — ツールの識別。カードのアクセシブルネーム(何のツールか)。無名のツール活動を許さない(第1条。Dialog の title と同型)。
- `input` — 呼び出しの引数の表示。busy の間の逐次生成は streaming の範囲であり、表示形式(整形 / 要約 / 隠す)は Expressive。
- `result` — 完了した結果の本体。ツール固有のレンダラ(Generative UI。§5)がここに入る。status=result のとき示す。
- `error` — 失敗の説明。status=error のとき示す。再試行可能 / 致命的の分類は畳んでおり、詳細は中身に委ねる(裁定 2026-07-25。tool-call §2。再試行してよいかは同じ失敗でもツールの性質で決まるアプリの知識で、どのフレームワークにも分類の型が無い)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- status(busy / result / error)の遷移が支援技術へ届く(tool-call §4)。遷移ごとに一度だけ告知し、busy の間の逐次(引数生成等)は洪水にしない。機構は表現(Web の aria-live / aria-busy、SwiftUI / Compose の accessibility announcement)。
- 告知の割り込み度は段階に連動する規則を tool-call §4 が持ち、本契約はそれを読む(新設しない。裁定 2026-07-25。水平展開テスト通過)。error は即時割り込み(Web の role=alert 相当)、busy / result は穏当な告知(role=status 相当)。error だけを割り込みに絞るのは、失敗が読むべき報告(color.md §5 の danger)であり、busy / result の連続告知が洪水になるのを避けるため。割り込みは status が動的に遷移したときにだけ起き、初期描画から在る status は読み上げ順で届く(Alert と同じ ARIA 実務)。
- busy は state.md §3.2(実行中に同じ呼び出しを再発火させない。aria-busy の領域)にだけ接地し、card=領域が aria-busy 相当を持つ(tool-call §3)。intent の差し替え・抑制の合成・チャンネルの解決には乗らない。busy の視覚(進行表示)は支援技術から隠す。実行中であることは領域が伝え、内部の進行表示自身が連呼しない(Skeleton と同型)。
- name はカードのアクセシブルネーム(aria-labelledby 相当で結ぶ)。無名のツール活動を許さない(第1条。Dialog の title と同型)。
- result / error スロットは status に応じて条件表示される内部領域である。その中に押せる要素(結果内のリンク等)があれば、focus とフォーカスリングと当たり判定の門はその要素に生きる。ルートの focusRing: false は ToolCall 自身が focus を受けないという意味で、内部要素を免除しない(条件付き部分要素の a11y をスキーマは表現できない。Alert / Tag と同じ限界の認識)。
- 承認待ち(requires-action)は本組織の関心でない。承認の到達性・振る舞い(キーボードから承認でき、応答後に実行へ戻る等)は HITL foundation とその organism が持つ(tool-call §2 / §4。先取りしない)。

### Tooltip(契約 0.0.0-alpha.1)

アンカー(トリガー)に添える短い補助ラベル(overlay の tooltip 類)。hover と focus の両方で開き、hover / focus の終了と Escape で閉じる。フォーカスを受け取らない(受け取れば popover。overlay.md §4)。必須情報を置いてはならない: タッチには hover が無く、focus 滞在も細いので、tooltip は補強であって唯一の経路ではない(overlay.md §4「hover でしか開けないものを作らない」)。位置はアンカー従属で、Web は CSS Anchor Positioning + native popover の top-layer で描く(切れない。憲法 第2条 / 第7条。Popover と同じ機構)。開閉は内部が所有する(hover / focus 駆動。アプリに管理させるのは実用に反する。overlay.md §6)。RFC 0007 D で Popover を建てたとき、Tooltip も安くなると予告した消費者。

props:

- `placement`: "block-start" | "block-end"(既定 "block-start") — アンカーに対する優先の開き方向(論理方向。layout.md §7)。block-start は上、block-end は下。既定は block-start(tooltip の通例は上)。画面端での反転は Expressive(overlay.md §5)。横(inline)側は初版で持たない(将来。まず上下)。

slots(Svelte では snippet。default は子要素をそのまま):

- `trigger`(必須) — tooltip が説明する対象(トリガー)。ここに置いた対話要素へ aria-describedby で tooltip を結ぶ。トリガー自身が単独で使えること(必須情報を tooltip に逃さない)。
- `content`(必須) — 補助ラベルの中身(短い文)。role=tooltip で描き、trigger の aria-describedby が指す。対話要素を置かない(置けば popover であって tooltip ではない)。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- content は role=tooltip + id を持ち、trigger の対話要素に aria-describedby=その id を配線する(Web の表現。SwiftUI / Compose では accessibilityHint 相当)。Normative なのは「補助説明が支援技術へ届く」ことで、機構は実装が選ぶ(field.md の disabled と同型)。
- hover と focus の両方で開く。タッチには hover が無いため focus 経路を必ず持つ(overlay.md §4)。閉じるのは hover / focus の終了と Escape(overlay.rules.json の tooltip.dismiss = triggerHoverFocusEnd)。
- tooltip 自身はフォーカスを受け取らない(pointer-events を切り、tabindex を持たない)。フォーカス可能にした時点でそれは tooltip でなく popover である(overlay.md §4)。scrim も背後スクロール封鎖も無い(tooltip 類)。
- 必須情報を tooltip に置かない。trigger は tooltip 無しでも意味が通ること(第1条。タッチと focus 経路の細さの帰結)。
- Web は native popover(top-layer)で描き、overflow / transform 祖先でも切れない。位置は CSS Anchor Positioning(anchor() / anchor-size は使わず内容幅)。非対応環境は JS の矩形計測で補う(第7条。Popover と同型)。

