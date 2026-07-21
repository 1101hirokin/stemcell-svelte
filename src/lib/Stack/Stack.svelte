<script lang="ts">
  import './Stack.css';
  import { META } from './meta';
  import { isTier, isGlobalPrimitive, warnSpacing } from '../internal/spacing';
  import type { Snippet } from 'svelte';

  interface Props {
    /** 並びの流れ。stack は積み(横書きでは縦)、inline は並び(同・横)。 */
    direction?: (typeof META.props.direction.values)[number];
    /** spacing の語彙: 段(sm / md / lg。direction に応じて stack / inline の意味層)または大域の原始 X(8〜24)。 */
    gap?: string;
    /** 交差軸の揃え。既定 stretch(内容は交差軸いっぱいに広がろうとする。第3条の flex 版)。 */
    align?: (typeof META.props.align.values)[number];
    children: Snippet;
  }
  let {
    direction = META.props.direction.default,
    gap = META.props.gap.default,
    align = META.props.align.default,
    children,
  }: Props = $props();

  const tier = $derived(isTier(gap));
  const primitive = $derived(!tier && isGlobalPrimitive(gap));
  $effect(() => {
    if (!tier && !primitive) warnSpacing('Stack', 'gap', gap, `既定の "${META.props.gap.default}" `);
  });
</script>

<!-- 見た目と意味を持たない器(契約 a11y): states 無し・focus 無し・構造の主張無し。 -->
<div
  class="sc-stack"
  data-direction={direction}
  data-gap={primitive ? undefined : tier ? gap : META.props.gap.default}
  data-align={align}
  style:gap={primitive ? `var(--spacing-${gap})` : undefined}
>
  {@render children()}
</div>
