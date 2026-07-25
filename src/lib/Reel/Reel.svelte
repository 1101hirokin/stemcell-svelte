<script lang="ts">
  import './Reel.css';
  import { META } from './meta';
  import { isTier, isGlobalPrimitive, warnSpacing } from '../internal/spacing';
  import type { Snippet } from 'svelte';

  // 横に流す帯(Reel.md)。あふれても折り返さず流れの方向へスクロールする(折り返すのは Cluster)。
  interface Props {
    /** spacing の語彙: 段(sm / md / lg。並びの間隔なので inline の意味層)または大域の原始 X(8〜24)。 */
    gap?: string;
    children: Snippet;
  }
  let { gap = META.props.gap.default, children }: Props = $props();

  const tier = $derived(isTier(gap));
  const primitive = $derived(!tier && isGlobalPrimitive(gap));
  $effect(() => {
    if (!tier && !primitive) warnSpacing('Reel', 'gap', gap, `既定の "${META.props.gap.default}" `);
  });

  // 実際にあふれているときだけ焦点を受ける。ポインタでしか届かない帯を作らないことが
  // 契約の Normative(第1条)で、Web での実現は tabindex になる。常時立てないのは、収まっている
  // 帯が中身の無い停留所になるため。この「スクロールするときだけ焦点を受ける」形は Chrome と
  // Firefox が focusable scrollers として実装した挙動そのもので、未対応の環境を自前で補う位置づけ
  // (第2条 / RFC 0010: 標準が与える形に合わせる)。
  let viewport: HTMLElement | undefined = $state();
  let track: HTMLElement | undefined = $state();
  let scrollable = $state(false);
  $effect(() => {
    const v = viewport;
    const t = track;
    if (!v || !t) return;
    // 器(見える幅)と帯(中身の幅)の両方を見る。帯は中身に合わせて伸びるので、子の増減や
    // 寸法の変化も帯の寸法変化として届く(子を個別に購読しなくてよい)。
    const measure = () => {
      scrollable = t.getBoundingClientRect().width - v.clientWidth > 1;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(v);
    ro.observe(t);
    return () => ro.disconnect();
  });
</script>

<!-- 見た目と意味を持たない器(契約 a11y): states 無し・構造の主張無し。role は立てない
     (スクロール領域の意味づけは Web の表現であり、契約が role を持たない)。
     焦点を受けるのでリング(focus-ring.md)は必須(契約 focusRing: true)。 -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- 規則は「素の要素を無闇に停留所にしない」ことを守らせるものだが、スクロール領域はその例外である
     (WCAG 2.1.1: ポインタでしか動かせない領域を作らない)。ここでは実際にあふれているときだけ
     立てるので、規則が防ごうとしている「中身の無い停留所」は生まれない。 -->
<div class="sc-reel" bind:this={viewport} tabindex={scrollable ? 0 : undefined}>
  <div
    class="sc-reel-track"
    bind:this={track}
    data-gap={primitive ? undefined : tier ? gap : META.props.gap.default}
    style:gap={primitive ? `var(--spacing-${gap})` : undefined}
  >
    {@render children()}
  </div>
</div>
