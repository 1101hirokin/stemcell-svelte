<script lang="ts">
  import './Grid.css';
  import { META } from './meta';
  import { isTier, isGlobalPrimitive, warnSpacing } from '../internal/spacing';
  import { isRemLength } from '../internal/length';
  import type { Snippet } from 'svelte';

  interface Props {
    /** 列の最小幅(rem の長さ。値語彙は未確定の seed。layout.md §9)。これを下回るなら列が減る。 */
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

  const gapTier = $derived(isTier(gap));
  const gapPrimitive = $derived(!gapTier && isGlobalPrimitive(gap));
  const validMin = $derived(isRemLength(min));
  $effect(() => {
    if (!gapTier && !gapPrimitive) warnSpacing('Grid', 'gap', gap, `既定の "${META.props.gap.default}" `);
    if (!validMin) {
      console.warn(
        `[stemcell] Grid: min="${min}" は rem の長さではない(仮置き: threshold の裁定と同じ本文相対。値語彙は未確定)。既定の "${META.props.min.default}" へ退避する(HOLES #20)。`,
      );
    }
  });
</script>

<!-- 見た目と意味を持たない器(契約 a11y): states 無し・focus 無し・構造の主張無し。
     列数は器が決める(auto-fit / minmax)。min が長さでないと template が無効になり
     内在の格子(Normative)が無警告で消えるため、検査して退避する -->
<div
  class="sc-grid"
  data-gap={gapPrimitive ? undefined : gapTier ? gap : META.props.gap.default}
  style:gap={gapPrimitive ? `var(--spacing-${gap})` : undefined}
  style:--sc-grid-min={validMin ? min : META.props.min.default}
>
  {@render children()}
</div>
