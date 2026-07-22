<script lang="ts">
  import './Popover.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  // アンカー従属の一時面プリミティブ(overlay の popover 類。Popover.md)。開閉・位置・light dismiss を担い、
  // 中身と role は消費者が与える。フォーカス戦略(DOM か仮想=activedescendant)も消費者が持つ(overlay.md §4)。
  interface Props {
    /** 開いているか。値であって状態ではない(overlay.md §6)。 */
    open?: boolean;
    /** アンカーに対する優先の開き方向(論理方向)。衝突で反転しうる(Expressive)。 */
    placement?: (typeof META.props.placement.values)[number];
    /** 開閉の要求(light dismiss は false を発火。所有者が open を更新する)。 */
    onopenchange?: (open: boolean) => void;
    /** トリガー。Popover はこれに従属して位置を決める。 */
    anchor: Snippet;
    /** 浮かぶ面の中身。role は消費者が与える。 */
    content: Snippet;
  }
  let {
    open = $bindable(META.props.open.default),
    placement = META.props.placement.default,
    onopenchange,
    anchor,
    content,
  }: Props = $props();

  let wrapperEl: HTMLElement;
  let contentEl = $state<HTMLElement>();
  // 衝突で反転したか(overlay.md §5: 反転は Expressive)。実効の開き方向は placement から導く
  let flipped = $state(false);
  const effectivePlacement = $derived(
    flipped ? (placement === 'block-end' ? 'block-start' : 'block-end') : placement,
  );

  function reposition() {
    if (!open || !wrapperEl || !contentEl) return;
    const a = wrapperEl.getBoundingClientRect();
    const h = contentEl.offsetHeight;
    const below = window.innerHeight - a.bottom;
    const above = a.top;
    flipped =
      placement === 'block-end' ? below < h && above > below : above < h && below > above;
  }

  // light dismiss(overlay.rules.json の dismiss.web: 外側 pointerdown / Escape / フォーカスの外への移動)と
  // アンカースクロール追従(overlay.md §5)。open の間だけ配線する。
  $effect(() => {
    if (!open) return;
    reposition();
    const onScroll = () => reposition();
    const onPointerdown = (e: PointerEvent) => {
      if (!wrapperEl.contains(e.target as Node)) onopenchange?.(false);
    };
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // 最上位の1枚だけ(overlay.md §3。消費者が重ねない限りこの1枚)
        e.stopPropagation();
        onopenchange?.(false);
      }
    };
    const onFocusout = () => {
      // フォーカスがラッパーの外へ出たら閉じる(次の tick で activeElement を見る)
      queueMicrotask(() => {
        if (!wrapperEl.contains(document.activeElement)) onopenchange?.(false);
      });
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    document.addEventListener('pointerdown', onPointerdown, true);
    document.addEventListener('keydown', onKeydown, true);
    wrapperEl.addEventListener('focusout', onFocusout);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('pointerdown', onPointerdown, true);
      document.removeEventListener('keydown', onKeydown, true);
      wrapperEl.removeEventListener('focusout', onFocusout);
    };
  });
</script>

<div class="sc-popover" bind:this={wrapperEl}>
  {@render anchor()}
  {#if open}
    <div class="sc-popover-content" bind:this={contentEl} data-placement={effectivePlacement}>
      {@render content()}
    </div>
  {/if}
</div>
