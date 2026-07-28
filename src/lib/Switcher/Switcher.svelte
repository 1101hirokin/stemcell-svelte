<script lang="ts">
  import './Switcher.css';
  import { META, isRemLength } from './meta';
  import { useGap } from '../internal/spacing.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    /** 切替の閾値(部品の幅がこれ未満で縦)。rem の長さ(裁定済み 2026-07。契約 alpha.1)。 */
    threshold?: string;
    /** spacing の語彙: 段(sm / md / lg)または大域の原始 X(8〜24)。生の px は受けない。 */
    gap?: string;
    children: Snippet;
  }
  let {
    threshold = META.props.threshold.default,
    gap = META.props.gap.default,
    children,
  }: Props = $props();

  const gapUse = useGap('Switcher', 'gap', () => gap, META.props.gap.default);
  const validThreshold = $derived(isRemLength(threshold));
  $effect(() => {
    if (!validThreshold) {
      console.warn(
        `[stemcell] Switcher: threshold="${threshold}" は rem の長さではない(単位は rem と裁定済み。契約 alpha.1)。既定の "${META.props.threshold.default}" へ退避する。`,
      );
    }
  });
</script>

<!-- 見た目と意味を持たない部品(契約 a11y): states 無し・focus 無し・構造の主張無し。
     切替は閾値駆動(flex-basis 算術)。DOM / 読み上げ順は切替で変わらない。 -->
<div
  class="sc-switcher"
  data-gap={gapUse.primitive ? undefined : gapUse.tier ? gap : META.props.gap.default}
  style:gap={gapUse.primitive ? `var(--spacing-${gap})` : undefined}
  style:--sc-switcher-threshold={validThreshold ? threshold : META.props.threshold.default}
>
  {@render children()}
</div>
