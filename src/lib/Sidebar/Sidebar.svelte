<script lang="ts">
  import './Sidebar.css';
  import { META } from './meta';
  import { isTier, isGlobalPrimitive, warnSpacing } from '../internal/spacing';
  import { isRemLength, isPercentage } from '../internal/length';
  import type { Snippet } from 'svelte';

  interface Props {
    /** 脇をどちらに置くか。論理方向(RTL で反転)。DOM 順も決める(視覚だけの入替はしない)。 */
    side?: (typeof META.props.side.values)[number];
    /** 脇の幅(rem の長さ。契約 alpha.1 が単位 rem を記録。数値集合は未確定の seed)。省略時は脇の内容幅。 */
    sideWidth?: string;
    /** 本体が保つ最小比率(百分率の文字列)。これを割ると縦積みへ折れる。 */
    contentMin?: string;
    /** spacing の語彙: 段(sm / md / lg)または大域の原始 X(8〜24)。 */
    gap?: string;
    /** 脇の中身(契約 alpha.1 の slot「aside」。旧名 side は prop と衝突し、GOVERNANCE §4 の規則で改名された)。 */
    aside: Snippet;
    children: Snippet;
  }
  let {
    side = META.props.side.default,
    sideWidth,
    contentMin = META.props.contentMin.default,
    gap = META.props.gap.default,
    aside,
    children,
  }: Props = $props();

  const gapTier = $derived(isTier(gap));
  const gapPrimitive = $derived(!gapTier && isGlobalPrimitive(gap));
  const validSideWidth = $derived(sideWidth === undefined || isRemLength(sideWidth));
  const validContentMin = $derived(isPercentage(contentMin));
  $effect(() => {
    if (!gapTier && !gapPrimitive) warnSpacing('Sidebar', 'gap', gap, `既定の "${META.props.gap.default}" `);
    if (!validSideWidth) {
      console.warn(
        `[stemcell] Sidebar: sideWidth="${sideWidth}" は rem の長さではない(仮置き。値語彙は未確定)。省略時と同じ内容幅へ退避する(HOLES #21)。`,
      );
    }
    if (!validContentMin) {
      console.warn(
        `[stemcell] Sidebar: contentMin="${contentMin}" は百分率ではない(契約)。既定の "${META.props.contentMin.default}" へ退避する(HOLES #21)。`,
      );
    }
  });
</script>

<!-- 見た目と意味を持たない器(契約 a11y)。DOM / 読み上げ順は side が決め、視覚だけの
     入替(order / row-reverse)はしない(WCAG 1.3.2)。折れても DOM 順は不変 -->
<div
  class="sc-sidebar"
  data-gap={gapPrimitive ? undefined : gapTier ? gap : META.props.gap.default}
  style:gap={gapPrimitive ? `var(--spacing-${gap})` : undefined}
  style:--sc-sidebar-side-width={validSideWidth && sideWidth !== undefined ? sideWidth : undefined}
  style:--sc-sidebar-content-min={validContentMin ? contentMin : META.props.contentMin.default}
>
  {#if side === 'start'}
    <div class="sc-sidebar-side">{@render aside()}</div>
    <div class="sc-sidebar-content">{@render children()}</div>
  {:else}
    <div class="sc-sidebar-content">{@render children()}</div>
    <div class="sc-sidebar-side">{@render aside()}</div>
  {/if}
</div>
