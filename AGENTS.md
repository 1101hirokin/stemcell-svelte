<!-- 自動生成。編集しない(源は契約と agents/generate.ts。再生成は bun run agents) -->
# @stemcell/svelte エージェント向けガイド

stemcell デザインシステムの Svelte 5 実装。部品の事実は機械可読契約
(stemcell-component-prompts)から生成されており、このファイルと契約が食い違ったら契約が正である。

## 前提(まずこれだけ守る)

- Svelte 5(runes)。named import: `import { Box, Button, Checkbox, Cluster, Divider, Grid, Icon, IconButton, Radio, RadioGroup, Select, Sidebar, Skeleton, Stack, StemcellProvider, Switch, Switcher, TextField, Textarea } from '@stemcell/svelte'`
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

### Box(契約 0.0.0-alpha.0)

内在スタイルの器。唯一の最高自由度の逃げ道(layout.md §6)。ただし逃げ道(自由 style の受け口)は契約に無い(裁定): プラットフォーム中立に定義できないため、契約はトークン値の中立表面だけを持ち、生 style の口は各実装の土地の声である。

props:

- `inset`: string((省略可)) — 内側余白。spacing の語彙。段(sm / md / lg)または大域の原始 X(8〜24 の整数の文字列。32px〜)。小域の原始(0〜7)は受けない(spacing.md §6: 小域は意味層で。layout.md §6)。生の px は受けない。混合型のため string であり、値の照合は実装側の適合テストの仕事。 省略時は余白なし。

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

### Checkbox(契約 0.0.0-alpha.1)

集合からの選択、または同意。送信(確定ステップ)を伴いうる(field.md §7 の線引き。裁定済み 2026-07)。即時反映する単独の設定なら Switch を使う。label のリッチ内容(リンク内包)の検算器(field.md §6)。

props:

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

### Cluster(契約 0.0.0-alpha.0)

折り返す横並び。タグの列・ボタンの列など、行に収まらなければ次の行へ流れる。全体が一斉に切り替わるのは Switcher(第2波)。

props:

- `gap`: string(既定 "md") — 要素間の間隔(両軸)。spacing の語彙。段(sm / md / lg)または大域の原始 X(8〜24 の整数の文字列。32px〜)。小域の原始(0〜7)は受けない(spacing.md §6: 小域は意味層で。layout.md §6)。生の px は受けない。混合型のため string であり、値の照合は実装側の適合テストの仕事。 段は spacing.gap の意味層を引く。
- `align`: "start" | "center" | "end"(既定 "start") — 行内の交差軸の揃え。

slots(Svelte では snippet。default は子要素をそのまま):

- `default`(必須) — 並べる中身。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 見た目と意味を持たない器である。states を持たず、focus を受けず、支援技術に構造を主張しない。意味を運ぶのは中身の仕事(layout.md §6)。

### Divider(契約 0.0.0-alpha.0)

区切る線。内容を持たない。余白(spacing)で区切りが足りるなら線を引かない、が既定の答えであり(第3条の抑制)、Divider は視覚的な線が要ると判断された場所にだけ現れる。

props:

- `orientation`: "stack" | "inline"(既定 "stack") — 何の流れを切るか。stack は積みの流れを(横書き Web では水平線)、inline は並びの流れを(同・垂直線)切る。値は spacing.md §4 の概念(stack / inline)と同じ論理方向であり、horizontal / vertical という物理値を採らないのは縦書きで軸が入れ替わるため(layout.md §7 の論理プロパティと同じ線)。物理方向への写像(aria-orientation の horizontal/vertical を含む)は各プラットフォームの表現。

a11y(実装が保証する。アプリ側で aria を足さないこと):

- 既定は装飾: 支援技術から隠す。意味のある区切り(セクションの境界)は見出し構造が運ぶべきで、線に意味を載せない。
- 集合の中の意味的な区切り(Menu 内の separator 等)はその集合の契約が定める。Divider 単体は意味を持たない。

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

### Select(契約 0.0.0-alpha.0)

閉じた選択肢の集合からひとつ選ぶ入力。選択肢を畳んで見せる(全選択肢を見せるなら RadioGroup。GOV.UK は「公開サービスでは最後の手段」とまで言う — 少数の選択肢は Radio が原則)。Web の実装は native select を基本とする(Select.md §2)。検索付き(Combobox)・複数選択は別部品の関心であり本契約は持たない。

props:

- `value`: string(既定 "") — 選択中の選択肢の value。空文字は未選択。アプリが所有する(field.md §5)。
- `options`: array — 選択肢の列。データとして渡す。
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

- role が combobox なのは HTML-AAM の写像に一致させたため: native の select(単一選択)は combobox role に写る。listbox はポップアップ側の role であり本体ではない。
- 開閉(open)を契約が持たないのは書き落としではない。Web の実装基盤である native select は開閉をブラウザが所有し、プログラムからの制御を許さない。中立の契約に open を書けば、native select 実装が契約を満たせなくなる(Select.md §2)。開閉のキーも UA 所有(web-keys.rules.json $combobox)。
- options のグルーピング(optgroup)は初版で持たない。必要の立証後に options の構造拡張で足す(破壊的でない)。
- invalid / required / disabled の配線は TextField と同じ(aria-invalid / required / state.md §5 の3要求)。
- モバイルでは OS のネイティブピッカーが開くことが利点そのものである(2026-07 調査: 専門家の一致)。ピッカーの見た目は UA / OS のものであり、Stemcell は関与しない。
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

### TextField(契約 0.0.0-alpha.2)

1行のテキスト入力。label / description / error を内包する複合フィールド(README の命名根拠)。解剖は foundations/field.md §2、値とイベントは同 §5(change 1本。裁定済み 2026-07)。8種の語彙の基準器: label の技術形状(slot)はここで決まり、Checkbox のリッチ label が検算する(field.md §6)。

props:

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

