<script lang="ts">
  import './FilePreview.css';
  import { META } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import type { Snippet } from 'svelte';

  // 選ばれたファイルを一つ見せる(FilePreview.md)。見せることと外すことだけを持つ。
  // 文字は作らない(大きさの書式は言語と単位系で変わる)。絵の寿命も持たない(作った側が捨てる)。
  interface Props {
    /** ファイルの名前。見た目は切り詰めるが、支援技術には全文が届く。 */
    fileName: string;
    /** 補足(大きさや種類)。書式は消費者が作る(i18n.md §1)。 */
    meta?: string;
    /** 下見の絵の在りか。無ければ種類の印を出す。 */
    thumbnail?: string;
    /** 外す操作の名前。DS は文言を持たない(i18n.md §1)。 */
    removeLabel: string;
    size?: (typeof META.props.size.values)[number];
    /** 外す操作が押された。列から外すのはアプリがする(部品は値を持たない)。 */
    onremove?: () => void;
    /** 下見の絵を消費者が描く場合の差し込み先。thumbnail より優先する。 */
    media?: Snippet;
  }
  let { fileName, meta, thumbnail, removeLabel, size = META.props.size.default, onremove, media }: Props =
    $props();
</script>

<div class="sc-filepreview" data-size={size}>
  <!-- 下見の絵は装飾である(名前が隣にある)。無ければ種類の印を出すが、それだけに頼らない -->
  <span class="sc-filepreview-media" aria-hidden="true">
    {#if media}{@render media()}{:else if thumbnail}
      <img class="sc-filepreview-image" src={thumbnail} alt="" />
    {:else}
      <Icon name="document" />
    {/if}
  </span>
  <span class="sc-filepreview-body">
    <!-- 切り詰めるのは見た目だけで、支援技術には全文が届く(Text の省略と同じ規則) -->
    <span class="sc-filepreview-name">{fileName}</span>
    {#if meta}<span class="sc-filepreview-meta">{meta}</span>{/if}
  </span>
  <button type="button" class="sc-filepreview-remove" aria-label={removeLabel} onclick={() => onremove?.()}>
    <Icon name="close" />
  </button>
</div>
