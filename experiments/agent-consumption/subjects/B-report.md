# 条件B(契約+散文)の自己申告(原文)

被験者(Sonnet・まっさらな文脈)が出力した「契約と散文から分からなかったこと・推測で埋めたこと」の転記。
コードは [B.svelte](./B.svelte)。

1. コンポーネントイベントの受け渡し規約。Button の click、TextField の change はどちらも中立の契約上「payload の型」しか定めておらず、Svelte でそれを `onclick={fn}` / `onchange={(value) => ...}` のようなコールバック prop で受けるのか、`on:click` ディレクティブと CustomEvent の `detail` で受けるのかが書かれていない。StemcellProvider.md §5 が「Svelte には `$bindable` がある」と一度触れているだけ。今回は Svelte 5 の慣行としてコールバック prop 形式を採用した。
2. スロットの技術形状。TextField の label / description / error、Button の start / end はすべて「slot」とだけ書かれており、Svelte 5 の snippet なのか従来の `slot="label"` 構文なのかが分からない。今回は snippet 前提で書いた。
3. TextField の幅の既定。layout.md §2 は「インライン/コントロールの既定は shrink-wrap、`block` で fill にオプトインする」と定めるが、TextField の契約には `block` 相当の prop が無い。Stack の `align: stretch`(既定)だけで TextField が横幅いっぱいに広がるのか、内容幅のまま埋もれるのかを契約から判断できなかった。TextField の要素クラス分類(block 系か control 系か)が明記されていれば不要な推測だった。
4. Button のフォーム参加機構が無い。Button.md §6 の未確定 TODO に「`type="submit"` 相当は TextField と同時に決める」と明記されている通り、契約に無い。そのため `<form>` とネイティブ submit を使わず、`onclick` でアプリ側の送信ロジックを直接呼ぶ実装にした。結果として Enter キーでの暗黙送信はこの実装では働かない。
5. error スロットの表示条件。field.md §3 は「`invalid` が立つとき error 部位が要る」としか書いておらず、`invalid=false` のときにコンポーネント側が error スニペットの表示を自動で抑制するのか、常時渡した内容がそのまま出るのかが分からなかった。今回は component 側が出し分ける前提で error を常時渡した。
6. バリデーションのタイミング。field.md §3 は「blur か submit か逐次かは規範化しない」と明言しつつ、TextField の event は `change`(逐次)1本のみで blur / focus に相当するイベントが契約に無い。「入力を離れたら検証する」という一般的な UX が組めないため、今回は submit 時にまとめて検証する GOV.UK 型を選んだ。
7. Switcher が縦積みに切り替わったときの子 Button の幅制御手段が無い。Button の `block` は静的な boolean で、Switcher 内部の閾値判定と連動する仕組みが契約に見当たらない。縦積み時にボタンが横幅いっぱいに広がってほしい場合の実現方法が文書からは分からなかった。
8. StemcellProvider を複数回マウントした場合の挙動。§8 で「DOM を出さない、document.documentElement に軸を立てる副作用」と書かれているが、複数回マウントされたときに冪等かどうかへの言及が無かった。複数ページ構成の実アプリでどこに1回だけ置くべきかの指針は文書からは得られなかった。
