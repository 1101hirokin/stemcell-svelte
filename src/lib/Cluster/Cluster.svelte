<script lang="ts">
  import './Cluster.css';
  import { META } from './meta';
  import { useGap } from '../internal/spacing.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    /** spacing の語彙: 段(sm / md / lg。spacing.gap の意味層)または大域の原始 X(8〜24)。両軸に効く。 */
    gap?: string;
    /** 行内の交差軸の揃え。 */
    align?: (typeof META.props.align.values)[number];
    children: Snippet;
  }
  let {
    gap = META.props.gap.default,
    align = META.props.align.default,
    children,
  }: Props = $props();

  const gapUse = useGap('Cluster', 'gap', () => gap, META.props.gap.default);
</script>

<!-- 見た目と意味を持たない部品(契約 a11y): states 無し・focus 無し・構造の主張無し。
     項目ごとに流れる(折返し)のが Cluster。全体が一斉に切り替わるのは Switcher。 -->
<div
  class="sc-cluster"
  data-gap={gapUse.primitive ? undefined : gapUse.tier ? gap : META.props.gap.default}
  data-align={align}
  style:gap={gapUse.primitive ? `var(--spacing-${gap})` : undefined}
>
  {@render children()}
</div>
