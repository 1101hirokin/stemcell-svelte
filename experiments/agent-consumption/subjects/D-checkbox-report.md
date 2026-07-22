# 条件D(Checkbox。契約+生成 AGENTS.md)の自己申告(原文)

被験者(Sonnet・まっさらな文脈)に利用規約同意フォーム(必須同意のリッチ label・任意購読・
親子 indeterminate・送信)を書かせた。読ませたのは AGENTS.md と Checkbox/TextField/Button/Stack
の契約のみ。コードは [D-checkbox.svelte](./D-checkbox.svelte)。

門の結果: 型 0 エラー・build 成功・実 Chromium で二重発火防止・親子 indeterminate 同期
(子1チェックで親 mixed、親トグルで子が揃う)がすべて green。被験者は動くコードを書けた。

自己申告(要点):

1. リッチ label のリンク: 読み取れた。Checkbox 契約の slots.label と a11y.notes に二重発火を
   部品が防ぐ旨が明記され、実装側で stopPropagation を書く必要はないと判断できた。推測不要。
2. indeterminate: 読み取れた。checked と独立の値でアプリが両方を所有、onchange の payload は
   新しい checked と契約に明記。親子の同期アルゴリズム自体は契約の関心外(アプリの仕事)であり、
   $derived で組んだ。
3. Button の type: 読み取れた。AGENTS.md の「よくある誤り」から type 既定 button・送信は
   明示 type="submit"・副作用はアプリ、と読めた。
4. checked の bind 可否: 推測で埋めた。AGENTS.md が $bindable と明言するのは TextField の
   value だけで、Checkbox の checked については何も無い。安全側に倒して checked + onchange の
   非 bind パターンを採った(どちらでも動く)。→ 生成器の写像規則を「値の prop(value / checked)は
   bind に対応する」と一般化して還流した。
5. <form> の使用: 推測で埋めた。stemcell に Form 相当は無く、AGENTS.md に form の具体例も無い。
   「type=submit で form 内なら送信される」から逆算して素の form で包んだ。→ patterns/forms.md §2
   が form 参加を定めているが、AGENTS.md には未反映(生成器は契約のみを源とするため、パターン
   文書は載らない。今後の課題)。
6. Checkbox に name が無い: 読み取れた。native form serialization は前提にせず全状態を $state で持った。
7. error の常時渡し: 読み取れた(AGENTS.md 明記)。

結論: 契約 + AGENTS.md だけで、二重発火・親子 indeterminate という難所を含む動くフォームに
到達した。残った推測は bind 可否(還流済み)と form パターン(patterns/forms.md にあるが AGENTS.md
未反映)の2点で、いずれも致命的でない。
