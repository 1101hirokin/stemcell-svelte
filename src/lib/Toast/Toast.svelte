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
  }: Props = $props();

  // 割り込みの度合いと intent の絵は Alert と同一規範(internal/notice-intent へ集約)。danger のみ即時
  // (role=alert)、他は穏当(role=status)。Toast は常に動的挿入なので必ず告知する。絵は色に頼らない識別
  // (WCAG 1.4.1)。
  const role = $derived(noticeRole(color));
  const intentGlyph = $derived(noticeGlyph(color));

  const uid = $props.id();
  const messageId = `${uid}-message`;
  const closeWordId = `${uid}-close`;
  // 閉じるの名は「message + 閉じる語」で合成し、兄弟として aria-labelledby で参照する(Alert の × と同型)。
  const dismissLabelledBy = `${messageId} ${closeWordId}`;
</script>

<!-- 個々の Toast が role=status/alert を持ち、動的挿入で告知する(領域は landmark。Toaster が担う)。
     intent の絵は装飾(aria-hidden)。名前配線はしない(内容が読み上げ順で届く領域。Alert と同型)。 -->
<div class="sc-toast" data-color={color} data-leaving={leaving || undefined} {role}>
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
