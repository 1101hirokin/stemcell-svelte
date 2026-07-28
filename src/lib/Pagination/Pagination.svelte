<script lang="ts">
  import './Pagination.css';
  import Button from '../Button/Button.svelte';
  import Select from '../Select/Select.svelte';
  import type { Snippet } from 'svelte';

  // 長い一覧を頁で行き来する(Pagination.md)。前後の移動と、現在地の表示を兼ねた行き先の選択。
  // 番号を列に並べる形は持たない: 頁が増えるほど省略の規則が要り、狭い画面で折り返して崩れる。
  interface Props {
    /** 今の頁(1 起点)。アプリが所有する値。 */
    page: number;
    /** 頁の総数。 */
    pages: number;
    /** 前へ戻る操作の名前。DS は文言を持たない(i18n.md §4)。 */
    previous: Snippet;
    /** 次へ進む操作の名前。 */
    next: Snippet;
    /** この領域と、中央の頁選択の名前(必須。無名の欄を許さない。field.md §2)。 */
    label: Snippet;
    /** 頁の移動の要求。アプリが page を更新する。 */
    onchange?: (page: number) => void;
  }
  let { page = $bindable(), pages, previous, next, label, onchange }: Props = $props();

  const uid = $props.id();
  const labelId = `${uid}-label`;

  // 選択肢は「今の頁 / 総数」の形で並べる。閉じた中央がそのまま現在地を語る(表し方は Expressive)。
  const options = $derived(
    Array.from({ length: Math.max(0, pages) }, (_, i) => ({
      value: String(i + 1),
      label: `${i + 1} / ${pages}`,
    })),
  );

  const go = (to: number) => {
    if (to < 1 || to > pages || to === page) return;
    page = to;
    onchange?.(to);
  };
</script>

<!-- 行き先を選ぶ領域(nav ランドマーク)。端では行き先が無いので操作を無効にする
     (押せるのに何も起きない形にしない。state.md §3.1)。
     中央は現在地の表示であると同時に行き先の選択で、選ばれている値がそのまま現在地を語る。
     欄の名前は領域の名前と同じものを使い、視覚からは隠す(部品が文脈を語っている。field.md §2)。 -->
<nav class="sc-pagination" aria-labelledby={labelId}>
  <span class="sc-pagination-label" id={labelId}>{@render label()}</span>

  <Button variant="outlined" color="plain" size="sm" disabled={page <= 1} onclick={() => go(page - 1)}>
    {@render previous()}
  </Button>

  <div class="sc-pagination-jump">
    <Select
      value={String(page)}
      {options}
      size="sm"
      labelHidden
      disabled={pages <= 1}
      onchange={(v) => go(Number(v))}
    >
      {#snippet label()}{@render label()}{/snippet}
    </Select>
  </div>

  <Button variant="outlined" color="plain" size="sm" disabled={page >= pages} onclick={() => go(page + 1)}>
    {@render next()}
  </Button>
</nav>
