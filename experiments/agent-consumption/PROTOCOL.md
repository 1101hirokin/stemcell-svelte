# エージェント消費の実測: プロトコル

「契約(+散文)だけから、エージェントが正しい使用コードを書けるか」の実験。
AI ネイティブ化の土台(裁定 2026-07: 根本思想として今から取り組み、部品追加のたびに適用する)の
最初の実測であり、契約スキーマに何が足りないかの裁定材料を出す。

## 方法

被験者はまっさらな文脈の LLM エージェント(Sonnet)。svelte リポの実装・テスト・playground は
読ませない。Web 検索も禁じ、Svelte 5 の一般知識と指定ファイルだけで書かせる。

課題は固定: 会員登録フォーム(氏名 + メール TextField、メールに description / error、
送信・キャンセル Button を Switcher で、全体を Stack、テーマ OS 追従)。

条件:

| 条件 | 読ませるもの |
|---|---|
| A: 契約のみ | 対象5部品の contract.json |
| B: 契約+散文 | A + 各部品の .md + foundations/field.md / layout.md |
| C: 契約+生成 AGENTS.md | A + 生成 v1 の出力(生成部品の効果測定) |

出力は App.svelte 1ファイルと、「分からなかったこと・推測で埋めたこと」の自己申告。
自己申告が主目的である(門が拾えるのは書き間違いだけで、正しく動くが規範に反する使い方や、
推測が偶然当たった場合の危うさは自己申告でしか見えない)。

評価は消費者ハーネス([harness/](./harness)。@stemcell/svelte を registry から install した
素の vite アプリ)で行う。被験者の生成物と自己申告の原文は [subjects/](./subjects) にあり、
再実行は `cd harness && bun install` の後 `bun experiments/agent-consumption/probe.ts <A|B|C>`:

1. svelte-check(型 = 使用検証の門の原型。存在しない prop / snippet はここで落ちる)
2. vite build
3. 実 Chromium で描画し、a11y 配線(label for / aria-describedby / aria-invalid)を実測
4. 契約・規範との目視照合(門が拾えない層: 語彙の発明、規範外の使い方)
5. 自己申告の分析(何が文書に無かったか)

## 判定の観点

- 型で落ちる誤り: 使用検証の門が機械で拾える(それ自体が門の実証)
- 型を通るが規範に反する誤り: 契約スキーマか生成文書の欠落。裁定材料
- 推測が当たったもの: 当たったのは偶然か、Svelte 慣習からの必然か(慣習尊重の統治が
  効いている証拠になりうる)を区別する
