<script lang="ts">
  import './Switcher.css';
  import { META, GAP_TIERS, isGlobalPrimitive, isLength } from './meta';
  import type { Snippet } from 'svelte';

  interface Props {
    /** 切替の閾値(器の幅がこれ未満で縦)。長さの文字列(seed)。単位の裁定は layout.md §9 待ち。 */
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

  const isTier = $derived((GAP_TIERS as readonly string[]).includes(gap));
  const isPrimitive = $derived(!isTier && isGlobalPrimitive(gap));
  const validThreshold = $derived(isLength(threshold));
  $effect(() => {
    if (!isTier && !isPrimitive) {
      console.warn(
        `[stemcell] Switcher: gap="${gap}" は spacing の語彙(sm/md/lg または 8〜24)ではない。既定の "${META.props.gap.default}" へ退避する(layout.md §6)。`,
      );
    }
    if (!validThreshold) {
      console.warn(
        `[stemcell] Switcher: threshold="${threshold}" は長さとして解釈できず、閾値駆動の切替(Normative)が無効になる。既定の "${META.props.threshold.default}" へ退避する。`,
      );
    }
  });
</script>

<!-- 見た目と意味を持たない器(契約 a11y): states 無し・focus 無し・構造の主張無し。
     切替は閾値駆動(flex-basis 算術)。DOM / 読み上げ順は切替で変わらない。 -->
<div
  class="sc-switcher"
  data-gap={isPrimitive ? undefined : isTier ? gap : META.props.gap.default}
  style:gap={isPrimitive ? `var(--spacing-${gap})` : undefined}
  style:--sc-switcher-threshold={validThreshold ? threshold : META.props.threshold.default}
>
  {@render children()}
</div>
