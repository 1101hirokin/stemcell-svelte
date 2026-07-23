<script lang="ts">
  import './Alert.css';
  import { META, WEB } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import closeGlyph from '@stemcell/icons/close';
  import noticeError from '@stemcell/icons/notice.error';
  import noticeAlert from '@stemcell/icons/notice.alert';
  import noticeOk from '@stemcell/icons/notice.ok';
  import noticeInfo from '@stemcell/icons/notice.info';
  import type { Snippet } from 'svelte';

  // 文での報告(Alert.md §1)。その場に留まり、状況が続く限り読める(勝手に消える報告は Toast の仕事)。
  interface Props {
    /** 報告の intent(color.md §5。Badge と同じ4値・既定 info)。 */
    color?: (typeof META.props.color.values)[number];
    /** 閉じられる報告。既定は閉じられない(状況が真のまま消せる既定は情報の喪失。§2)。 */
    dismissible?: boolean;
    /** × が押された(取り除くのはアプリ。Alert は自分を消さない)。 */
    ondismiss?: () => void;
    /** × の閉じる語(Web 層の i18n。既定 Close。上書き可。i18n.md)。 */
    dismissLabel?: string;
    /** 見出し(任意)。短い要約。Alert 自身の名前にはしない(§3)。 */
    title?: Snippet;
    /** 本文(必須)。何が起きているか、どうすればよいか。 */
    children: Snippet;
  }
  let {
    color = META.props.color.default,
    dismissible = META.props.dismissible.default,
    ondismiss,
    dismissLabel = WEB.dismissLabel.default,
    title,
    children,
  }: Props = $props();

  // 割り込みの度合いを intent から導く(Stemcell 独自の規範。§3): 即時(role=alert)は danger だけ、
  // warning/success/info は穏当(role=status)。割り込みは動的挿入時にだけ起きる(live region の実務。
  // 静的な内容は読み上げ順で届く)。role を置けば native の live region がこの条件を無償で満たす(第2条)。
  const role = $derived(color === 'danger' ? 'alert' : 'status');

  // intent の絵(色に頼らない識別。WCAG 1.4.1)。notice 一族が用途どおり(暫定の対応。Alert.md §5 で ratify)。
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
  const titleId = `${uid}-title`;
  const closeWordId = `${uid}-close`;
  // × の名は「文脈(title)+ 閉じる語」で合成。title 内のリンク等と入れ子にせず aria-labelledby で兄弟参照
  // (§3。Tag の × と同型)。title が無ければ閉じる語だけ。
  const dismissLabelledBy = $derived(title ? `${titleId} ${closeWordId}` : closeWordId);
</script>

<!-- root は名前を持たない領域(title を aria-labelledby にしない。§3)。role が live region を与え、動的挿入で
     割り込む。intent の絵は装飾(aria-hidden。AT は role + 本文で種類を得る。絵は色頼りでない視覚の手がかり)。 -->
<div class="sc-alert" data-color={color} {role}>
  <span class="sc-alert-icon" aria-hidden="true"><Icon glyph={intentGlyph} /></span>
  <div class="sc-alert-content">
    {#if title}<div class="sc-alert-title" id={titleId}>{@render title()}</div>{/if}
    <div class="sc-alert-body">{@render children()}</div>
  </div>
  {#if dismissible}
    <button class="sc-alert-dismiss" type="button" aria-labelledby={dismissLabelledBy} onclick={() => ondismiss?.()}>
      <Icon glyph={closeGlyph} />
    </button>
    <span id={closeWordId} hidden>{dismissLabel}</span>
  {/if}
</div>
