<script lang="ts">
  import './Grid.css';
  import { META } from './meta';
  import { useGap } from '../internal/spacing.svelte';
  import { isWidthTier, WIDTH_TIERS } from '../internal/length';
  import type { Snippet } from 'svelte';

  interface Props {
    /** 列の最小幅。閉じた6段(8/12/16/20/24/32rem。契約 alpha.2。layout.md §9)。これを下回るなら列が減る。 */
    min?: string;
    /** spacing の語彙: 段(sm / md / lg。spacing.gap の意味層)または大域の原始 X(8〜24)。両軸に効く。 */
    gap?: string;
    children: Snippet;
  }
  let {
    min = META.props.min.default,
    gap = META.props.gap.default,
    children,
  }: Props = $props();

  const gapUse = useGap('Grid', 'gap', () => gap, META.props.gap.default);
  const validMin = $derived(isWidthTier(min));
  $effect(() => {
    if (!validMin) {
      console.warn(
        `[stemcell] Grid: min="${min}" は幅の段(${WIDTH_TIERS.join(' / ')})ではない(裁定 2026-07。契約 alpha.2)。既定の "${META.props.min.default}" へ退避する(HOLES #20)。`,
      );
    }
  });
</script>

<!-- 見た目と意味を持たない器(契約 a11y): states 無し・focus 無し・構造の主張無し。
     列数は器が決める(auto-fit / minmax)。min が長さでないと template が無効になり
     内在の格子(Normative)が無警告で消えるため、検査して退避する。
     ul の grid 化がリスト意味論を壊す罠(Grid.md §4 / layout.md §6)は、現行 API では
     発火しない: grid になるのはこの div であり、中身の ul は素のまま。ul 自体を格子に
     したい合成は消費者の責任で role="list" を再付与する(独立レビュー指摘で明文化) -->
<div
  class="sc-grid"
  data-gap={gapUse.primitive ? undefined : gapUse.tier ? gap : META.props.gap.default}
  style:gap={gapUse.primitive ? `var(--spacing-${gap})` : undefined}
  style:--sc-grid-min={validMin ? min : META.props.min.default}
>
  {@render children()}
</div>
