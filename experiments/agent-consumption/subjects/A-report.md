# 条件A(契約のみ)の自己申告(原文)

被験者(Sonnet・まっさらな文脈)が出力した「契約から分からなかったこと・推測で埋めたこと」の転記。
コードは [A.svelte](./A.svelte)。

1. StemcellProvider の Svelte 上の配置形。契約は slots が空であることから「子を包まない副作用コンポーネント」と読めるが、Svelte としての具体的な使用形(自己完結タグとして一度だけ置くのか、どの階層に置くべきか)の例は無い。`<StemcellProvider theme="auto" />` と自己完結タグで置く形を推測した。契約に Svelte 向けの最小使用例があれば推測は不要だった。
2. Button の click、TextField の change の Svelte API 形。契約はプラットフォーム中立に「events: click(payload void)」「events: change(payload string)」とあるだけで、Svelte(Web)側のプロパティ名や束縛の形(callback prop の onclick / onchange なのか、on:click / on:change のカスタムイベントで detail に payload が入るのか)は書かれていない。callback prop 形式を推測した。Web 規範層に Svelte の具体的なプロパティ名の対応表があれば迷わずに済んだ。
3. TextField の value 受け渡しが単方向 callback か bind:value 糖衣か。契約は value を独立した prop、change を独立した event として書いており、Svelte 5 の $bindable による bind:value 糖衣構文で提供される可能性もある。ここでは value prop + onchange callback という明示的な単方向の形を採用した。
4. label / description / error / start / end スロットの Svelte 5 上の実装形。named slot 要素なのか、snippet prop なのかが契約からは分からない。Svelte 5 なので snippet 形式と推測したが確証は無い。
5. error スロットの表示条件。契約は「invalid が立つのに error が空であることは機械的には許される」としか書いておらず、invalid が false で error スロットに中身がある場合にどう振る舞うかは書かれていない。invalid prop の値に応じてコンポーネント内部が表示を切り替える実装だろうと推測し、error スニペットは常に渡した上で invalid prop だけを真偽で切り替える書き方にした。
6. フォーム送信の実現方法。Button の props に type="submit" 相当のものが無く、契約は click イベントまでしか定義しない。form は使わず送信ボタンの onclick だけで完結させる形を選んだ。
7. Stack の gap の具体値。sm / md / lg のどれがフォームに適するかという指針は契約に無く、"lg" を任意に選んだ。
8. autocomplete の具体的なトークン。契約は「WHATWG Autofill のトークンを正とする」とだけ言っており、氏名欄・メール欄それぞれにどのトークンを当てるかは書かれていない。"name" と "email" を妥当な値として推測した。
9. パッケージのエクスポート形。`@stemcell/svelte` から named import できるかどうかの正確な形は契約ファイルに記載が無く、課題文の指示のとおりにそのまま named import した。
