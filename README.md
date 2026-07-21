# @stemcell/svelte

Stemcell の Svelte 実装。規範は [stemcell-component-prompts](../stemcell-component-prompts) が持ち、
本リポはそれに適合する(GOVERNANCE §6-2)。実装が仕様に先行して事実を作ることはない(同 前文)。

## 実験リポとしての役割

本リポの最初の仕事は「仕様(契約+散文+foundations)だけから、実装判断が一意に決まるか」の実験である
(WORKFLOW §3 の実地検証)。仕様が決めていない判断に出会ったら、実装で埋めずに [HOLES.md](./HOLES.md) に
記録する。運用は次のとおり:

- Normative に触る穴(props / 値 / a11y 要求の欠落・矛盾): 手を止め、仕様へ戻す。
- 表現の穴(Web の土地の声として正当に選べるもの): 仮置きして記録し、バッチで仕様側の
  「実物で判断」TODO と突き合わせる。
- 実装対象は main にマージ済みの契約だけ(門を通っていない draft は実装しない)。

## 適合(conformance)

`bun run conformance` が contracts/ から検査を生成して実行する:

- 契約の props 名 / enum 値 / 既定値と、実装の PROPS メタデータの一致(extends は解決済み)
- tokensRequired の CSS 変数が実装 CSS に現れること

各コンポーネントは `src/lib/<Name>/meta.ts` に PROPS(既定値の単一の源)を持ち、
コンポーネント本体はそこから既定値を読む。契約 ↔ meta ↔ 実装が一列に繋がる。

## トークン

`@stemcell/tokens` は未 publish(初回 publish は「第三者が追従可能になった時点」。GOVERNANCE §3)。
それまで隣の作業コピー(`../stemcell-tokens/dist/web`)を参照する。
