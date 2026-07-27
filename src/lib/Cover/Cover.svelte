<script lang="ts">
  import './Cover.css';
  import { META } from './meta';
  import { useGap } from '../internal/spacing.svelte';
  import type { Snippet } from 'svelte';

  // 1画面ぶんの骨格(Cover.md)。器の高さいっぱいに立ち、主役を残り空間の中央に置き、
  // 頭と足を端に保つ。脇付きのページ骨格は Sidebar との合成、覆いは Dialog / Imposter の仕事。
  interface Props {
    /** spacing の語彙: 段(sm / md / lg。縦の間隔なので stack の意味層)または大域の原始 X(8〜24)。 */
    gap?: string;
    /** 頭。上端に留まる。 */
    header?: Snippet;
    /** 主役。残りの空間の中央に置かれる。 */
    children: Snippet;
    /** 足。下端に留まる。 */
    footer?: Snippet;
  }
  let { gap = META.props.gap.default, header, children, footer }: Props = $props();

  const gapUse = useGap('Cover', 'gap', () => gap, META.props.gap.default);
</script>

<!-- 見た目と意味を持たない器(契約 a11y): states 無し・focus 無し・構造の主張無し。
     頭と足は <header> / <footer> にしない。あれらは banner / contentinfo のランドマークを
     主張してしまい、器が構造を主張しないという共通則(layout.md §6)に反する。
     意味づけが要るなら中身がその要素を持つ。 -->
<div
  class="sc-cover"
  data-gap={gapUse.primitive ? undefined : gapUse.tier ? gap : META.props.gap.default}
  style:gap={gapUse.primitive ? `var(--spacing-${gap})` : undefined}
>
  {#if header}
    <div class="sc-cover-header">{@render header()}</div>
  {/if}
  <div class="sc-cover-main">{@render children()}</div>
  {#if footer}
    <div class="sc-cover-footer">{@render footer()}</div>
  {/if}
</div>
