<script lang="ts">
  import './Tooltip.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  // アンカーに添える短い補助ラベル(overlay の tooltip 類。Tooltip.md)。hover と focus の両方で開き、両方の
  // 終了と Escape で閉じる。フォーカスを受け取らない(受け取れば popover)。必須情報を置かない(overlay.md §4)。
  // Web は native popover(top-layer。切れない)+ CSS Anchor Positioning で描く(憲法 第2条 / 第7条。Popover と
  // 同じ機構)。popover は manual で持ち hover / focus を自前で拾う(auto の light dismiss には乗らない)。
  interface Props {
    /** 優先の開き方向(論理方向)。既定は block-start(上)。衝突で反転しうる。 */
    placement?: (typeof META.props.placement.values)[number];
    /** tooltip が説明する対象(トリガー)。中の対話要素へ aria-describedby を配線する。 */
    trigger: Snippet;
    /** 補助ラベルの中身(短い文。対話要素を置かない)。 */
    content: Snippet;
  }
  let { placement = META.props.placement.default, trigger, content }: Props = $props();

  const uid = $props.id();
  const tipId = `${uid}-tip`;
  const anchorName = `--sc-tip-${uid}`;
  const supportsAnchor =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('anchor-name: --x');

  let wrapperEl: HTMLElement;
  let tipEl = $state<HTMLElement>();
  // hover と focus は独立に持ち、両方が終わって初めて閉じる(片方の偶発的な終了で消さない。overlay.md §4)。
  let hovering = $state(false);
  let focused = $state(false);
  const open = $derived(hovering || focused);
  let flipped = $state(false); // JS フォールバック時の反転
  const effectivePlacement = $derived(
    flipped ? (placement === 'block-start' ? 'block-end' : 'block-start') : placement,
  );

  // aria-describedby を trigger の最初の実フォーカス可能要素へ配線する。tooltip 本体(role=tooltip・非対話)の
  // サブツリーと tabindex=-1(実タブ移動しない管理用)は除く。trigger の中身が差し替わっても追う(MutationObserver)。
  let describedTarget: HTMLElement | undefined;
  function wireDescribedby() {
    if (!wrapperEl) return;
    const next =
      [...wrapperEl.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')].find(
        (el) => !tipEl?.contains(el) && el.getAttribute('tabindex') !== '-1',
      ) ?? wrapperEl;
    if (next === describedTarget) return;
    describedTarget?.removeAttribute('aria-describedby');
    next.setAttribute('aria-describedby', tipId);
    describedTarget = next;
  }
  $effect(() => {
    wireDescribedby();
    const mo = new MutationObserver(() => wireDescribedby());
    mo.observe(wrapperEl, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      describedTarget?.removeAttribute('aria-describedby');
      describedTarget = undefined;
    };
  });

  // JS フォールバック(anchor 非対応時のみ)。アンカー矩形から fixed 位置を決める。衝突で反転。left はアンカー中央で、
  // CSS の translateX(-50%) が箱を中央に寄せる。
  function position() {
    if (!tipEl || !wrapperEl) return;
    const a = wrapperEl.getBoundingClientRect();
    const h = tipEl.offsetHeight;
    const above = a.top;
    const below = window.innerHeight - a.bottom;
    flipped = placement === 'block-start' ? above < h && below > above : below < h && above > below;
    const eff = flipped ? (placement === 'block-start' ? 'block-end' : 'block-start') : placement;
    const GAP = 6;
    // アンカー中央に置くが、画面の外へはみ出さないよう押し戻す(translateX(-50%) を見込んで幅の半分で挟む)
    const half = tipEl.offsetWidth / 2;
    const center = a.left + a.width / 2;
    const gutter = 8;
    tipEl.style.left = `${Math.min(Math.max(center, half + gutter), Math.max(half + gutter, window.innerWidth - half - gutter))}px`;
    tipEl.style.top = eff === 'block-start' ? `${a.top - h - GAP}px` : `${a.bottom + GAP}px`;
  }

  const isShown = (el: HTMLElement) => {
    try {
      return el.matches(':popover-open');
    } catch {
      return false;
    }
  };
  $effect(() => {
    const el = tipEl;
    if (!el || typeof el.showPopover !== 'function') return;
    if (open) {
      if (!isShown(el)) el.showPopover();
      if (!supportsAnchor) position();
    } else if (isShown(el)) {
      el.hidePopover();
    }
  });
  // anchor 非対応時のみ、開いている間はスクロール / リサイズでアンカーへ追従する(対応時は CSS が自動追従。
  // Popover と同じ。open の瞬間だけ計算して固定すると、フォールバックでアンカーからずれる)。
  $effect(() => {
    if (!open || supportsAnchor) return;
    const onScroll = () => position();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  });

  // hover は touch を除く(タップの合成 pointerenter で居座らせない。focus 経路がキーボードを担う)。
  function onEnter(e: PointerEvent) {
    if (e.pointerType !== 'touch') hovering = true;
  }
  function onLeave(e: PointerEvent) {
    if (e.pointerType !== 'touch') hovering = false;
  }
  function onFocusin() {
    focused = true;
  }
  function onFocusout() {
    // フォーカスがラッパーの外へ出たときだけ閉じる(trigger 内の要素間移動でちらつかせない。Popover と同型)
    queueMicrotask(() => {
      if (!wrapperEl.contains(document.activeElement)) focused = false;
    });
  }
  function onKeydown(e: KeyboardEvent) {
    // Escape は両チャンネルを落として即座に閉じる(再 hover / 再 focus で開き直せる)
    if (e.key === 'Escape') {
      hovering = false;
      focused = false;
    }
  }
</script>

<!-- ラッパーは anchor-name の箱 + hover/focus の検出範囲で、それ自身は対話しない(対話する本体は中の trigger)。
     pointer/focus は tooltip を開閉する補強、keydown は Escape で閉じるためで、span を操作要素にはしない -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
  class="sc-tooltip"
  bind:this={wrapperEl}
  style:anchor-name={anchorName}
  onpointerenter={onEnter}
  onpointerleave={onLeave}
  onfocusin={onFocusin}
  onfocusout={onFocusout}
  onkeydown={onKeydown}
>
  {@render trigger()}
  <div
    class="sc-tooltip-content"
    bind:this={tipEl}
    popover="manual"
    role="tooltip"
    id={tipId}
    data-placement={effectivePlacement}
    style:position-anchor={anchorName}
  >
    {@render content()}
  </div>
</span>
