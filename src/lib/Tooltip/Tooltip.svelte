<script lang="ts">
  import './Tooltip.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  // アンカーに添える短い補助ラベル(overlay の tooltip 類。Tooltip.md)。hover と focus の両方で開き、離脱と
  // Escape で閉じる。フォーカスを受け取らない(受け取れば popover)。必須情報を置かない(overlay.md §4)。
  // Web は native popover(top-layer。切れない)+ CSS Anchor Positioning で描く(憲法 第2条 / 第7条。Popover と
  // 同じ機構)。ただし popover は manual で持ち、hover / focus を自前で拾う(auto の light dismiss には乗らない)。
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
  let open = $state(false);
  // JS フォールバック時の反転
  let flipped = $state(false);
  const effectivePlacement = $derived(
    flipped ? (placement === 'block-start' ? 'block-end' : 'block-start') : placement,
  );

  // aria-describedby を、トリガーの最初の対話要素(無ければラッパー)へ配線する。tooltip 本体(role=tooltip・
  // 非対話)は対象にしない。トリガーの中身は消費者が与えるので、機構は実装が拾う(field.md の配線と同型)。
  $effect(() => {
    const focusable = wrapperEl.querySelector<HTMLElement>(
      'button, a[href], input, select, textarea, [tabindex]',
    );
    const target = focusable ?? wrapperEl;
    target.setAttribute('aria-describedby', tipId);
    return () => target.removeAttribute('aria-describedby');
  });

  // JS フォールバック(anchor 非対応時のみ)。アンカー矩形から fixed 位置を決める。衝突で反転。
  function position() {
    if (!tipEl || !wrapperEl) return;
    const a = wrapperEl.getBoundingClientRect();
    const h = tipEl.offsetHeight;
    const above = a.top;
    const below = window.innerHeight - a.bottom;
    flipped = placement === 'block-start' ? above < h && below > above : below < h && above > below;
    const eff = flipped ? (placement === 'block-start' ? 'block-end' : 'block-start') : placement;
    const GAP = 6;
    tipEl.style.left = `${a.left + a.width / 2}px`;
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

  function show() {
    open = true;
  }
  function hide() {
    open = false;
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') hide();
  }
</script>

<!-- ラッパーは anchor-name の箱 + hover/focus の検出範囲で、それ自身は対話しない(対話する本体は中の trigger)。
     pointer/focus は tooltip を開閉する補強、keydown は Escape で閉じるためで、span を操作要素にはしない -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
  class="sc-tooltip"
  bind:this={wrapperEl}
  style:anchor-name={anchorName}
  onpointerenter={show}
  onpointerleave={hide}
  onfocusin={show}
  onfocusout={hide}
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
