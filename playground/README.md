# playground

実装済み部品を実物で触って確認する器(WORKFLOW §2-6)。配信物ではない。

```
bun run playground
```

## 構成

```
App.svelte        殻。脇の一覧・テーマと密度の切替・画面の切り替えだけを持つ
screens/index.ts  画面の目次(並びはロードマップのクラスタ順)
screens/*.svelte  1画面 = 1クラスタ。その画面で使う状態も同じファイルが持つ
playground.css    飾り(枠・下敷き・見本)。部品ではない
```

節を足すときは `screens/` の該当ファイルへ `<section>` を1つ加える。殻は触らない。
新しいクラスタが増えたときだけ、`screens/index.ts` に1行と、`App.svelte` の対応表に1行を足す。

## 決め事

- 1画面 = 1クラスタ。順序はロードマップ(WORKFLOW §クラスタ表)に従う。部品が増えたとき、
  どこへ置くかを毎回考えなくてよいようにするため
- 節の形は揃える。見出し(`Text as="h3"`)、一行の説明(`body-sm` の muted)、実物、の順
- 状態はその画面のファイルが持つ。画面をまたぐ状態は殻(テーマと密度)だけ
- 殻も DS の部品で組む(`Sidebar` / `NavList` / `Select`)。playground 自身が消費者の一人である
- 飾りの class は `pg-` で始める。部品の class(`sc-`)と混ぜない
