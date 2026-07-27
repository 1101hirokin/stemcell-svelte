<script lang="ts">
  import './Toast.css';
  import { META, WEB } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import closeGlyph from '@stemcell/icons/close';
  import { noticeRole, noticeGlyph } from '../internal/notice-intent';

  // 勝手に消えてよい報告(overlay の notification 類。Toast.md)。Toaster がキュー data から描く。
  // 内容は data(message は文字列。命令形召喚ゆえスロットでない。RFC 0013)。
  interface Props {
    /** 本文。 */
    message: string;
    /** 報告の intent(color.md §5。既定 info)。 */
    color?: (typeof META.props.color.values)[number];
    /** 明示的に閉じられるか(既定 true。一時的な報告は逃げ道を既定に。第1条)。 */
    dismissible?: boolean;
    /** 単一アクションのラベル。あれば押せる要素が現れ、自律退去しない。 */
    actionLabel?: string;
    /** アクション活性化のハンドラ。 */
    onaction?: () => void;
    /** 閉じる要求(退去はホストが行う)。 */
    ondismiss?: () => void;
    /** 閉じる語(Web 層の i18n。既定 Close。i18n.md)。 */
    dismissLabel?: string;
    /** 退去アニメ中(ホストが制御。data-leaving を出す)。 */
    leaving?: boolean;
    /** 退去アニメが終わったことを知らせる(ホストがキューから外す)。 */
    onexitend?: () => void;
  }
  let {
    message,
    color = META.props.color.default,
    dismissible = META.props.dismissible.default,
    actionLabel,
    onaction,
    ondismiss,
    dismissLabel = WEB.dismissLabel.default,
    leaving = false,
    onexitend,
  }: Props = $props();

  // 割り込みの度合いと intent の絵は Alert と同一規範(internal/notice-intent へ集約)。danger のみ即時
  // (role=alert)、他は穏当(role=status)。Toast は常に動的挿入なので必ず告知する。絵は色に頼らない識別
  // (WCAG 1.4.1)。
  const role = $derived(noticeRole(color));
  const intentGlyph = $derived(noticeGlyph(color));

  // 退去の終わりは要素に走っているアニメーションが教える(Web Animations の finished)。
  // 時間を JS で計算して待つ形は持たない(CSS と JS で同じ値を二重に持つことになる。憲法 第2条)。
  // アニメーションが無い場合(reduced-motion で 0 になる・消費者が止める)も finished は即座に解決する。
  let el = $state<HTMLElement>();
  $effect(() => {
    if (!leaving || !el) return;
    let live = true;
    const running = el.getAnimations();
    if (running.length === 0) onexitend?.();
    else void Promise.allSettled(running.map((a) => a.finished)).then(() => live && onexitend?.());
    return () => (live = false);
  });

  const uid = $props.id();
  const messageId = `${uid}-message`;
  const closeWordId = `${uid}-close`;
  // 閉じるの名は「message + 閉じる語」で合成し、兄弟として aria-labelledby で参照する(Alert の × と同型)。
  const dismissLabelledBy = `${messageId} ${closeWordId}`;
</script>

<!-- 個々の Toast が role=status/alert を持ち、動的挿入で告知する(領域は landmark。Toaster が担う)。
     intent の絵は装飾(aria-hidden)。名前配線はしない(内容が読み上げ順で届く領域。Alert と同型)。 -->
<div class="sc-toast" bind:this={el} data-color={color} data-leaving={leaving || undefined} {role}>
  <span class="sc-toast-icon" aria-hidden="true"><Icon glyph={intentGlyph} /></span>
  <div class="sc-toast-message" id={messageId}>{message}</div>
  {#if actionLabel}
    <button
      class="sc-toast-action"
      type="button"
      onclick={() => {
        onaction?.();
        ondismiss?.();
      }}
    >
      {actionLabel}
    </button>
  {/if}
  {#if dismissible}
    <button class="sc-toast-dismiss" type="button" aria-labelledby={dismissLabelledBy} onclick={() => ondismiss?.()}>
      <Icon glyph={closeGlyph} />
    </button>
    <span id={closeWordId} hidden>{dismissLabel}</span>
  {/if}
</div>
