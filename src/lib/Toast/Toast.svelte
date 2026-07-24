<script lang="ts">
  import './Toast.css';
  import { META, WEB } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import closeGlyph from '@stemcell/icons/close';
  import noticeError from '@stemcell/icons/notice.error';
  import noticeAlert from '@stemcell/icons/notice.alert';
  import noticeOk from '@stemcell/icons/notice.ok';
  import noticeInfo from '@stemcell/icons/notice.info';

  // 勝手に消えてよい報告(overlay の notification 類。Toast.md)。Toaster がキュー data から描く。
  // 内容は data(message は文字列。命令形召喚ゆえスロットでない。RFC 0013)。
  interface Props {
    /** 通知の識別子(ストアのキュー id)。 */
    id: string;
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
    id,
    message,
    color = META.props.color.default,
    dismissible = META.props.dismissible.default,
    actionLabel,
    onaction,
    ondismiss,
    dismissLabel = WEB.dismissLabel.default,
    leaving = false,
  }: Props = $props();

  // 割り込みの度合いを intent から導く(Alert と同一の Stemcell 規範。§3): 即時(role=alert)は danger
  // だけ、warning/success/info は穏当(role=status)。Toast は常に動的挿入なので必ず告知する。
  const role = $derived(color === 'danger' ? 'alert' : 'status');

  // intent の絵(色に頼らない識別。WCAG 1.4.1)。Alert と同じ notice 一族。
  const intentGlyph = $derived(
    color === 'danger'
      ? noticeError
      : color === 'warning'
        ? noticeAlert
        : color === 'success'
          ? noticeOk
          : noticeInfo,
  );

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
