<script lang="ts">
  import './Popover.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  // アンカー従属の一時面プリミティブ(overlay の popover 類。Popover.md)。native popover API(top-layer)で
  // 描くので overflow:hidden / transform 祖先でも切れない。Escape / 外側クリックの light dismiss と
  // 多重時の LIFO(overlay.md §3)はブラウザが管理する(自前で document リスナを張らない)。
  // 位置決め・幅同期・衝突反転は CSS Anchor Positioning(anchor()/anchor-size()/position-try)に委ねる
  // (憲法 第2条: native の機構で満たす。Baseline 2026)。非対応環境だけ JS の矩形計測で補う(第7条)。
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

  const uid = $props.id();
  // インスタンス固有のアンカー名(複数の Popover が互いのアンカーを掴まないように)。
  const anchorName = `--sc-pop-${uid}`;
  // CSS Anchor Positioning が使えるか。使えれば位置・幅・反転を CSS へ委ね、JS の矩形計測と scroll/resize を張らない。
  const supportsAnchor =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('anchor-name: --x');

  let wrapperEl: HTMLElement;
  let contentEl = $state<HTMLElement>();
  // JS フォールバック時のみ使う。衝突で反転したか(overlay.md §5: 反転は Expressive)。
  let flipped = $state(false);
  const effectivePlacement = $derived(
    flipped ? (placement === 'block-end' ? 'block-start' : 'block-end') : placement,
  );
  const GAP = 4; // トリガーと面の隙間(px。JS フォールバック時。CSS 側は spacing.inline.md)

  // JS フォールバック(anchor 非対応時のみ)。アンカー矩形から fixed 位置と幅を決める。衝突で反転。
  function position() {
    if (!contentEl || !wrapperEl) return;
    const a = wrapperEl.getBoundingClientRect();
    contentEl.style.setProperty('--sc-popover-anchor-inline-size', `${a.width}px`);
    const h = contentEl.offsetHeight;
    const below = window.innerHeight - a.bottom;
    const above = a.top;
    flipped = placement === 'block-end' ? below < h && above > below : above < h && below > above;
    const eff = flipped ? (placement === 'block-end' ? 'block-start' : 'block-end') : placement;
    // 画面の外へはみ出さないよう押し戻す(CSS 側の position-try に対応する退避)
    const width = contentEl.offsetWidth;
    const gutter = GAP * 2;
    const left = Math.min(Math.max(a.left, gutter), Math.max(gutter, window.innerWidth - width - gutter));
    contentEl.style.left = `${left}px`;
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
      if (!supportsAnchor) position(); // CSS が位置を持つなら JS 計測は不要
    } else if (isShown(el)) {
      el.hidePopover();
    }
  });

  // フォーカスが外へ出たら閉じる。open の間だけ。Escape / 外側の LIFO は native popover が担う。
  // anchor 非対応時のみ、追従のため scroll/resize を張る(対応時は CSS が自動追従する)。
  $effect(() => {
    if (!open) return;
    const onFocusout = () =>
      queueMicrotask(() => {
        if (!wrapperEl.contains(document.activeElement)) onopenchange?.(false);
      });
    wrapperEl.addEventListener('focusout', onFocusout);
    let removeScroll: (() => void) | undefined;
    if (!supportsAnchor) {
      const onScroll = () => position();
      window.addEventListener('scroll', onScroll, true);
      window.addEventListener('resize', onScroll);
      removeScroll = () => {
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('resize', onScroll);
      };
    }
    return () => {
      wrapperEl.removeEventListener('focusout', onFocusout);
      removeScroll?.();
    };
  });

  // native の light dismiss(Escape / 外側)で閉じたら所有者へ伝える。自分で hide したときは open が既に
  // false なので二重発火しない。
  function onToggle(e: Event) {
    if ((e as ToggleEvent).newState === 'closed' && open) onopenchange?.(false);
  }
</script>

<div class="sc-popover" bind:this={wrapperEl} style:anchor-name={anchorName}>
  {@render anchor()}
  <div
    class="sc-popover-content"
    bind:this={contentEl}
    popover="auto"
    data-placement={effectivePlacement}
    style:position-anchor={anchorName}
    ontoggle={onToggle}
  >
    {@render content()}
  </div>
</div>
