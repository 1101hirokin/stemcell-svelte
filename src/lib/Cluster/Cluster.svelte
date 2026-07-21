<script lang="ts">
  import './Cluster.css';
  import { META } from './meta';
  import { isTier, isGlobalPrimitive, warnSpacing } from '../internal/spacing';
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

  const tier = $derived(isTier(gap));
  const primitive = $derived(!tier && isGlobalPrimitive(gap));
  $effect(() => {
    if (!tier && !primitive) warnSpacing('Cluster', 'gap', gap, `既定の "${META.props.gap.default}" `);
  });
</script>

<!-- 見た目と意味を持たない器(契約 a11y): states 無し・focus 無し・構造の主張無し。
     項目ごとに流れる(折返し)のが Cluster。全体が一斉に切り替わるのは Switcher。 -->
<div
  class="sc-cluster"
  data-gap={primitive ? undefined : tier ? gap : META.props.gap.default}
  data-align={align}
  style:gap={primitive ? `var(--spacing-${gap})` : undefined}
>
  {@render children()}
</div>
