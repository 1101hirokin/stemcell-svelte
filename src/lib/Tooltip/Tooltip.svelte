<script lang="ts">
  import './Tooltip.css';
  import { META } from './meta';
  import {
    resolveSides,
    resolvePosition,
    inlineShift,
    type OverlaySides,
  } from '../internal/overlay-position';
  import type { Snippet } from 'svelte';

  // アンカーに添える短い補助ラベル(overlay の tooltip 類。Tooltip.md)。hover と focus の両方で開き、両方の
  // 終了と Escape で閉じる。フォーカスを受け取らない(受け取れば popover)。必須情報を置かない(overlay.md §4)。
  // Web は native popover(top-layer。切れない)+ CSS Anchor Positioning で描く(憲法 第2条 / 第7条。Popover と
  // 同じ機構)。popover は manual で持ち hover / focus を自前で拾う(auto の light dismiss には乗らない)。
  interface Props {
    /** 優先の開き方向(論理方向)。既定は block-start(上)。トリガーの居場所で反転しうる。 */
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
  // 開く向きは overlay-position.ts の規則で決める(Popover と共有。overlay.md §5: 反転は Expressive)。
  // tooltip の揃えはトリガーの中心で、はみ出すときだけ端へ寄る。測る前は placement を優先の向きに使う。
  let measured = $state<OverlaySides>();
  const blockSide = $derived(measured?.block ?? (placement === 'block-end' ? 'end' : 'start'));
  const inlineSide = $derived(measured?.inline ?? 'center');

  // CSS が置いたあとに残るはみ出しを横へ押し戻す(anchor 対応時。非対応時は resolvePosition が同じことをする)
  function shiftIntoView() {
    if (!tipEl) return;
    tipEl.style.setProperty('--sc-tooltip-shift', '0px'); // 押し戻す前の位置で測る
    const r = tipEl.getBoundingClientRect();
    const dx = inlineShift(r.left, r.width);
    if (dx) tipEl.style.setProperty('--sc-tooltip-shift', `${dx}px`);
  }

  /** 向きを決めて返す。返り値を使うのは、書いた state を同じ effect で読み返さないため。 */
  function decideSides(): OverlaySides | undefined {
    if (!wrapperEl) return;
    const sides = resolveSides(wrapperEl.getBoundingClientRect(), tipEl?.offsetWidth ?? 0, 'center');
    measured = sides;
    return sides;
  }

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

  // JS フォールバック(anchor 非対応時のみ)。決めた向きに合わせて fixed 位置を置く。
  const GAP = 6; // トリガーと面の隙間(px。CSS 側は spacing.inline.md)
  function position() {
    if (!tipEl || !wrapperEl) return;
    const sides = decideSides();
    if (!sides) return;
    const a = wrapperEl.getBoundingClientRect();
    const at = resolvePosition(
      a,
      { width: tipEl.offsetWidth, height: tipEl.offsetHeight },
      sides,
      GAP,
    );
    tipEl.style.top = `${at.top}px`;
    tipEl.style.left = `${at.left}px`;
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
    } else if (isShown(el)) {
      el.hidePopover();
    }
  });
  // 開いた時点で向きを決め、スクロール / リサイズの間は決め直す(トリガーの居場所が変わるため)。位置
  // そのものの追従は対応環境なら CSS が持ち、非対応環境では position() が両方をやる(Popover と同型)。
  $effect(() => {
    if (!open) return;
    const update = () => {
      if (supportsAnchor) {
        decideSides();
        // 向きの反映(属性 → CSS)を待ってから、残ったはみ出しを測って押し戻す
        requestAnimationFrame(shiftIntoView);
      } else {
        position();
      }
    };
    update();
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    // 見えている領域そのものが動く場面(触点の鍵盤の出入り、拡大)。版面は動かない
    const vv = window.visualViewport;
    vv?.addEventListener('resize', onScroll);
    vv?.addEventListener('scroll', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      vv?.removeEventListener('resize', onScroll);
      vv?.removeEventListener('scroll', onScroll);
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
    data-block={blockSide}
    data-inline={inlineSide}
    style:position-anchor={anchorName}
  >
    {@render content()}
  </div>
</span>
