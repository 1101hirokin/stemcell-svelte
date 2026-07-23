<script lang="ts">
  import './Popover.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  // アンカー従属の一時面プリミティブ(overlay の popover 類。Popover.md)。native popover API(top-layer)で
  // 描くので overflow:hidden / transform 祖先でも切れない。Escape / 外側クリックの light dismiss と
  // 多重時の LIFO(overlay.md §3)はブラウザが管理する(自前で document リスナを張らない = 多重時に全部
  // 閉じる不具合を避ける)。位置はアンカー矩形から計算し、フォーカス戦略は消費者が持つ(overlay.md §4)。
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
  const GAP = 4; // トリガーと面の隙間(px)

  // アンカー矩形から fixed 位置と幅を決める(top-layer はビューポート基準)。衝突で反転(Expressive)。
  function position() {
    if (!contentEl || !wrapperEl) return;
    const a = wrapperEl.getBoundingClientRect();
    contentEl.style.setProperty('--sc-popover-anchor-inline-size', `${a.width}px`);
    const h = contentEl.offsetHeight;
    const below = window.innerHeight - a.bottom;
    const above = a.top;
    flipped = placement === 'block-end' ? below < h && above > below : above < h && below > above;
    const eff = flipped ? (placement === 'block-end' ? 'block-start' : 'block-end') : placement;
    contentEl.style.left = `${a.left}px`;
    contentEl.style.top = eff === 'block-end' ? `${a.bottom + GAP}px` : `${a.top - h - GAP}px`;
  }

  // 開閉を native popover へ橋渡し(top-layer へ出す/戻す)。popover API 非対応環境(jsdom 等)では
  // API 呼び出しを飛ばす(中身は常に DOM にあるので、ロジックのテストは成立する)。
  const isShown = (el: HTMLElement) => {
    try {
      return el.matches(':popover-open');
    } catch {
      return false;
    }
  };
  $effect(() => {
    const el = contentEl;
    if (!el || typeof el.showPopover !== 'function') return;
    if (open) {
      if (!isShown(el)) el.showPopover();
      position();
    } else if (isShown(el)) {
      el.hidePopover();
    }
  });

  // アンカースクロール追従(overlay.md §5)＋ フォーカスが外へ出たら閉じる。open の間だけ。
  // Escape / 外側クリックの LIFO は native popover が担うのでここでは張らない。
  $effect(() => {
    if (!open) return;
    const onScroll = () => position();
    const onFocusout = () =>
      queueMicrotask(() => {
        if (!wrapperEl.contains(document.activeElement)) onopenchange?.(false);
      });
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    wrapperEl.addEventListener('focusout', onFocusout);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      wrapperEl.removeEventListener('focusout', onFocusout);
    };
  });

  // native の light dismiss(Escape / 外側)で閉じたら所有者へ伝える。自分で hide したときは open が既に
  // false なので二重発火しない。
  function onToggle(e: Event) {
    if ((e as ToggleEvent).newState === 'closed' && open) onopenchange?.(false);
  }
</script>

<div class="sc-popover" bind:this={wrapperEl}>
  {@render anchor()}
  <div
    class="sc-popover-content"
    bind:this={contentEl}
    popover="auto"
    data-placement={effectivePlacement}
    ontoggle={onToggle}
  >
    {@render content()}
  </div>
</div>
