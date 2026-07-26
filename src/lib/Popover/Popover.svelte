<script lang="ts">
  import './Popover.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  // アンカー従属の一時面プリミティブ(overlay の popover 類。Popover.md)。native popover API(top-layer)で
  // 描くので overflow:hidden / transform 祖先でも切れない。Escape / 外側クリックの light dismiss と
  // 多重時の LIFO(overlay.md §3)はブラウザが管理する(自前で document リスナを張らない)。
  // 位置決め・幅同期は CSS Anchor Positioning(anchor()/anchor-size())に委ねる(憲法 第2条: native の
  // 機構で満たす。Baseline 2026)。非対応環境だけ JS の矩形計測で補う(第7条)。開く向きだけは、
  // トリガーが描画領域のどちら側に居るかで決める(下記 decideSides)。
  interface Props {
    /** 開いているか。値であって状態ではない(overlay.md §6)。 */
    open?: boolean;
    /** アンカーに対する優先の開き方向(論理方向)。トリガーの居場所で反転しうる(Expressive)。 */
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

  // 開く向きは、トリガーが描画領域のどこに居るかで決める(overlay.md §5: 反転は Expressive)。
  // 面の大きさで測って「入るかどうか」を判定する形は採らない: 中身が伸び縮みするたびに向きが変わり、
  // 面の中で送るようにすると溢れが消えて判定そのものが働かなくなる。位置なら結果が読める。
  // 測る前は placement を優先の向きとして使い、開いた時点で位置が上書きする。
  let measured = $state<{ block: 'start' | 'end'; inline: 'start' | 'end' }>();
  const blockSide = $derived(measured?.block ?? (placement === 'block-start' ? 'start' : 'end'));
  const inlineSide = $derived(measured?.inline ?? 'start');
  const GAP = 4; // トリガーと面の隙間(px。JS フォールバック時。CSS 側は spacing.inline.md)

  /** トリガーの中心が上半分なら下へ、下半分なら上へ。左半分なら右へ伸び、右半分なら左へ伸びる。 */
  function decideSides() {
    if (!wrapperEl) return;
    const a = wrapperEl.getBoundingClientRect();
    measured = {
      block: a.top + a.height / 2 < window.innerHeight / 2 ? 'end' : 'start',
      inline: a.left + a.width / 2 < window.innerWidth / 2 ? 'start' : 'end',
    };
  }

  // JS フォールバック(anchor 非対応時のみ)。決めた向きに合わせて fixed 位置を置く。
  function position() {
    if (!contentEl || !wrapperEl) return;
    decideSides();
    const a = wrapperEl.getBoundingClientRect();
    contentEl.style.setProperty('--sc-popover-anchor-inline-size', `${a.width}px`);
    contentEl.style.top =
      blockSide === 'end' ? `${a.bottom + GAP}px` : `${a.top - contentEl.offsetHeight - GAP}px`;
    contentEl.style.left =
      inlineSide === 'start' ? `${a.left}px` : `${a.right - contentEl.offsetWidth}px`;
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
    } else if (isShown(el)) {
      el.hidePopover();
    }
  });

  // フォーカスが外へ出たら閉じる。open の間だけ。Escape / 外側の LIFO は native popover が担う。
  // あわせて開く向きを決め、画面が動く間は決め直す(トリガーの居場所が変わるため)。
  $effect(() => {
    if (!open) return;
    const onFocusout = () =>
      queueMicrotask(() => {
        if (!wrapperEl.contains(document.activeElement)) onopenchange?.(false);
      });
    wrapperEl.addEventListener('focusout', onFocusout);
    // 開いた時点で一度測る(位置そのものの追従は、対応環境なら CSS が持つ)
    const update = () => (supportsAnchor ? decideSides() : position());
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
    const removeScroll = () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
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
    data-block={blockSide}
    data-inline={inlineSide}
    style:position-anchor={anchorName}
    ontoggle={onToggle}
  >
    {@render content()}
  </div>
</div>
