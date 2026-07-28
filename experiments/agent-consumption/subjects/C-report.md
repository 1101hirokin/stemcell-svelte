# 条件C(契約+生成 AGENTS.md)の自己申告(原文)

被験者(Sonnet・まっさらな文脈)が出力した「文書から分からなかったこと・推測で埋めたこと」の転記。
コードは [C.svelte](./C.svelte)。写像(イベント / snippet / bind / Provider / error 条件)への言及が
消えている点が A / B との差である。

1. email の invalid を立てるタイミング。契約は「いつ立てるかは規範化しない」と明言しており、AGENTS.md は「確定タイミングが要るなら部品を包む要素で focusout / keydown を捕捉する」としか言っていない。そこで素の `<div onfocusout>` で TextField を包んだが、AGENTS.md 本文は「素の要素(生の div)の直接使用は非推奨で、逃げ道は Box に集約する」とも述べている。課題指示が使ってよい部品を5つに限定しており Box が含まれるのか読み取れなかったため、指示を優先して素の div を使った。Box をこの用途に使ってよいか(あるいは focusout 捕捉に推奨される作法)が書いてあれば推測不要だった。
2. tokens CSS と StemcellProvider の置き場所。AGENTS.md は「アプリの入口で」と言うが、課題は App.svelte 単体の提出を求めている。App.svelte がその「入口/ルート」を兼ねる前提で両方をここに書いた。
3. autocomplete の具体的トークン値。契約は「語彙は WHATWG Autofill のトークンを正とする」と述べるだけで、`name` / `email` のような具体的な文字列は列挙していない。一般知識で埋めた。
4. Switcher 内ボタンの幅・並び順。Switcher の契約には align に相当する prop が無く、縦積みになったときにボタンをどう揃えるかの指針が見当たらなかった。並び順(送信が先か)についても契約は沈黙しており、課題文の記述順を採用した。
5. キャンセルボタンの variant / color。`variant="outlined" color="plain"` は一般的な UI 習慣からの判断であり、契約・AGENTS.md のどちらにも「キャンセル操作にはこれ」という記述は無かった。
6. `<form>` 要素で囲むかどうか(Enter キー送信)。AGENTS.md は「Button に type="submit" は無い。送信は onclick でアプリが行う」と明記し(注: この記述は後の独立レビューで不正確と判明し、native 既定の submit 挙動への注意に改稿された)、`<form>` 要素自体を使うべきかの推奨・非推奨は書かれていなかった。今回は `<form>` を使わず onclick のみで送信する実装にした。
7. required の要否。「会員登録フォーム」という文脈からの判断であり、stemcell 契約の問題ではない。
8. TypeScript の有無。読んでよい範囲からはプロジェクトが lang="ts" 前提かどうか分からなかったため、プレーン JS で書いた。

注: 3(autocomplete の例示)と 2(入口の明確化)は本実験後に生成のテンプレートへ還流済み。
