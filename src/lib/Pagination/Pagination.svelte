<script lang="ts">
  import './Pagination.css';
  import Button from '../Button/Button.svelte';
  import type { Snippet } from 'svelte';

  // 長い一覧を頁で行き来する(Pagination.md)。頁番号の列は持たない(第3条)。
  interface Props {
    /** 今の頁(1 起点)。アプリが所有する値。 */
    page: number;
    /** 頁の総数。 */
    pages: number;
    /** 前へ戻る操作の名前。DS は文言を持たない(i18n.md §4)。 */
    previous: Snippet;
    /** 次へ進む操作の名前。 */
    next: Snippet;
    /** この領域の名前(「ページ送り」等)。 */
    label?: Snippet;
    /** 頁の移動の要求。アプリが page を更新する。 */
    onchange?: (page: number) => void;
  }
  let { page = $bindable(), pages, previous, next, label, onchange }: Props = $props();

  const uid = $props.id();
  const labelId = `${uid}-label`;

  const go = (to: number) => {
    if (to < 1 || to > pages) return;
    page = to;
    onchange?.(to);
  };
</script>

<!-- 行き先を選ぶ領域(nav ランドマーク)。端では行き先が無いので操作を無効にする
     (押せるのに何も起きない形にしない。state.md §3.1)。位置は視覚にも支援技術にも同じく届く。 -->
<nav class="sc-pagination" aria-labelledby={label ? labelId : undefined}>
  {#if label}
    <span class="sc-pagination-label" id={labelId}>{@render label()}</span>
  {/if}
  <Button variant="outlined" color="plain" size="sm" disabled={page <= 1} onclick={() => go(page - 1)}>
    {@render previous()}
  </Button>
  <span class="sc-pagination-position" aria-current="page">{page} / {pages}</span>
  <Button variant="outlined" color="plain" size="sm" disabled={page >= pages} onclick={() => go(page + 1)}>
    {@render next()}
  </Button>
</nav>
