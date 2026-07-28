# エージェント消費の実測: 結果(2026-07-22)

方法は [PROTOCOL.md](./PROTOCOL.md)。被験者はまっさらな Sonnet エージェント3体、課題は同一
(会員登録フォーム)。評価は消費者ハーネス(registry から install した素の vite アプリ)で
svelte-check・vite build・実 Chromium の a11y 配線検査を行い、自己申告を分析した。

## 結果の要約

| 条件 | 型 | build | 実描画の a11y 配線 | 推測の自己申告 |
|---|---|---|---|---|
| A: 契約のみ | 0 エラー | 成功 | 全問正解(label for / inputmode / autocomplete / aria-invalid / describedby 両参照) | 9件 |
| B: 契約+散文 | 0 エラー | 成功 | 全問正解(submit 一括検証を意図して選択。押下後に配線を確認) | 8件 |
| C: 契約+生成 AGENTS.md | 0 エラー | 成功 | 全問正解(blur 検証を focusout 包みで実装) | 8件(ただし写像の推測は 0件) |

3条件とも「正しく動くアクセシブルなフォーム」に到達した。差は正しさではなく確証の量と
判断の質に出た。

## 条件D: Checkbox(部品追加のたびの実測。2026-07-22)

WORKFLOW §2-6 の「エージェント消費の実測を実装 Done に含める」の最初の運用。Checkbox 実装後、
まっさらな Sonnet に利用規約同意フォーム(必須同意のリッチ label・任意購読・親子 indeterminate・
送信)を書かせた。読ませたのは AGENTS.md と Checkbox/TextField/Button/Stack の契約のみ。
コードと自己申告は [subjects/D-checkbox.svelte](./subjects/D-checkbox.svelte) と同 -report.md。

| 条件 | 型 | build | 実 Chromium | 推測 |
|---|---|---|---|---|
| D: 契約+AGENTS.md | 0 エラー | 成功 | 二重発火防止・親子 indeterminate 同期(子チェックで親 mixed、親トグルで子が揃う)が green | 実ギャップ2件 |

読み取れたこと:

- 難所(リッチ label のリンク二重発火、indeterminate の第三の値、Button の type)はすべて
  AGENTS.md と契約から正しく読めた。被験者は stopPropagation を書かず native の抑制に委ね、
  indeterminate を独立の値として親子同期を $derived で組んだ。契約の記述が難所を運べている。
- 実ギャップは2件。(1) checked が bind 可能か AGENTS.md に無かった(value のみ記載)。被験者は
  非 bind の controlled パターンに倒して正解した。→ 生成部品の写像規則を「値の prop(value /
  checked / indeterminate)は bind に対応する」と一般化して還流した。(2) form の組み立て
  (form タグ・送信)の具体例が AGENTS.md に無い。patterns/forms.md §2 が定めているが、生成部品は
  契約のみを源とするためパターン文書が載らない。パターン文書をエージェント配布物へ載せる経路は
  今後の課題(生成 v2 の候補)。
- 検査の教訓: 実 Chromium で反応的な状態(親子同期)を測るときは、DOM の .click() を別々の
  evaluate に分けて Svelte の更新をフラッシュさせる必要がある(1回の evaluate 内でクリック直後に
  読むと未反映で偽陰性になる。probe の初版がこれを踏んだ)。

## 読み取れること

1. 契約だけでも Svelte 5 の慣習知識で写像の推測がすべて当たる(条件A)。これは実装が
   慣習に忠実だから成立する(GOVERNANCE §6-2 の慣習尊重の実証)。ただし被験者A自身が
   9件を「確証の無い推測」と申告しており、on:click 形式に賭ける別の被験者なら型エラーで
   落ちていた。当たったのは慣習からの必然と偶然の中間である。
2. 散文は判断の質を上げるが、写像の確証は与えない(条件B)。B は field.md を引いて
   submit 一括検証(GOV.UK 型)を設計判断として選び、Button.md §6 の TODO を引いて
   form 要素を諦めた。一方でイベントの形・snippet の形は A と同じく推測のままだった。
   散文はさらに深い問い(TextField の幅クラス、Switcher 縦時の子幅、Provider の冪等性)を
   立てさせた。問いの解像度を上げる効果がある。
3. 生成 AGENTS.md は写像の推測を消す(条件C)。C の申告に写像への言及は無く、
   bind:value・snippet・Provider の置き方・error の常時渡しを確信して使った。さらに
   AGENTS.md の「確定が要るなら focusout で包む」の一行から blur 検証を正しく組んだ。
   これは field.md の非規範指針(離脱時に裁く)と同じ形だが、C は field.md を読んでいない。
   一行の写像知識が散文一冊分の挙動を再現した。
4. 型は写像の誤りを拾う門として機能する。実験前のハーネス整備で、alpha.2 の aside 改名に
   追従していない旧使用コード(sideSlot)を svelte-check が検出した。存在しない prop /
   snippet は使用側の型検査で落ちる。使用検証の門の最小形は「消費者ハーネスで svelte-check」
   である。
5. 残る空白はパターン水準に集中する。3条件が共通して埋められなかったのは、部品の外の
   合成の指針である: form 要素を使うべきか、キャンセルの variant 慣習、Switcher 縦時の
   子の幅、検証タイミングの推奨、Box で包むべき場面。これらは field.md §3 / §8 が予告する
   「フォームパターンの部品」の関心と一致する。部品の契約を太らせる話ではない。

## 還流した改善

- AGENTS.md 生成(v1)は本実験の条件A/Bの申告を元に設計した(写像表・よくある誤り)。
- 条件Cの申告から: autocomplete の値の例示、アプリの入口(tokens CSS / Provider の置き場所)の
  明確化を生成のテンプレートへ追加した。
- 仕様側への報告事項(裁定待ち): フォームパターンの文書(上記5)、error 表示条件の契約明文化
  (「invalid でないとき error 部位は現れない」は実装の事実だが契約に無い)、TextField の
  幅クラス(shrink-wrap か fill か)の layout.md での分類。

## 限界

- 被験者は各条件1体で、モデルも1種(Sonnet)。推測の当たり方には個体差がありうる。
  条件Aの「全部当たった」を一般化しないこと。
- 課題は1種(フォーム)。レイアウト合成やオーバーレイでは別の空白が出る見込み。
  部品追加のたびに同じ実測を行う(WORKFLOW の門に組み込む)。
