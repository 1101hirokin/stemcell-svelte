<script lang="ts">
  import './Text.css';
  import { META, WEB } from './meta';
  import type { Snippet } from 'svelte';

  // content に typography 役割を当てる原始(Text.md §1)。視覚役割(variant)と意味要素(as)を分離する:
  // variant は見た目(サイズ・weight・字間)だけを決め、見出しの階層は as が担う。混ぜると「大きい文字=
  // 見出し」の誤りで構造が壊れる(§2)。相互作用しない(role もフォーカスも持たない)。
  interface Props {
    /** typography の合成役割(16。既定 body-md)。見た目だけを決め、意味要素は含意しない。 */
    variant?: (typeof META.props.variant.values)[number];
    /** はみ出す文字を1行で省略する。全文は DOM に残り支援技術へ届く(切るのは見た目だけ)。
     *  1行省略には block 文脈が要るので、truncate=true のとき要素は block になる(as=span でも。Text.md §2)。 */
    truncate?: boolean;
    /** 副次の文字色(app.fg-muted)。既定は色を宣言せず周囲を継承する。 */
    muted?: boolean;
    /** 意味要素(Web 層。a11y の意味の Web 表現。§2)。既定は中立の span。 */
    as?: (typeof WEB.as.values)[number];
    children: Snippet;
  }
  let {
    variant = META.props.variant.default,
    truncate = META.props.truncate.default,
    muted = META.props.muted.default,
    as = WEB.as.default,
    children,
  }: Props = $props();
</script>

<!-- 多相要素: as が意味を持つ(h1..h6 / p / span / div)。variant は見た目だけを data 属性で当てる。 -->
<svelte:element
  this={as}
  class="sc-text"
  data-variant={variant}
  data-truncate={truncate || undefined}
  data-muted={muted || undefined}
>{@render children()}</svelte:element>
