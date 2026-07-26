<script lang="ts" generics="T extends { id: string }">
  import './Table.css';
  import { META, type TableColumn, type TableSort } from './meta';
  import Checkbox from '../Checkbox/Checkbox.svelte';
  import Icon from '../Icon/Icon.svelte';
  import type { Snippet } from 'svelte';

  // 行と列に意味がある表(Table.md)。器が構造(見出しとセルの対応・並べ替えの表明・選択の列)を持ち、
  // 中身はアプリが差す。表であって grid ではない: セルは焦点を受けず、キーはセルのあいだを渡らない
  // (APG 逐語: a WAI-ARIA table is a static tabular structure ... its cells are not focusable or selectable)。
  // 並べ替えも絞り込みも器はしない。要求を返すだけで、並んだ結果は rows としてアプリが渡す。
  interface Props {
    /** 列の宣言。見出しとセルの対応・並べ替えの表明・揃えを器が保証するために要る。 */
    columns: TableColumn[];
    /** 行の列。並んだ順にそのまま描く(器は並べ替えない)。 */
    rows: T[];
    /** セルに収まらない中身の扱い。scroll は1行に収めて横へ送る、wrap は折り返す。 */
    overflow?: (typeof META.props.overflow.values)[number];
    /** 横へ送るとき、行の始まり側 / 終わり側の列を貼り付けるか(overflow=wrap では効かない)。 */
    sticky?: (typeof META.props.sticky.values)[number];
    /** いま並べ替わっている列と向き。アプリが持つ値で、器は表明するだけ。 */
    sort?: TableSort;
    /** 選ばれている行の id の集合。この値と onselectedchange が揃ったときだけ選択の列が現れる。 */
    selected?: string[];
    /** 寸法(size.md §2 の3段)。 */
    size?: (typeof META.props.size.values)[number];
    /** 並べ替えの要求。解除は null。 */
    onsortchange?: (sort: TableSort | null) => void;
    /** 選択の要求。選ばれている行の id の集合を渡す。 */
    onselectedchange?: (selected: string[]) => void;
    /** 行の押下。一次の行き先へ進む要求で、行の id を渡す。 */
    onrowactivate?: (id: string) => void;
    /** 表の名前。無名の表を許さない(複数の表がある画面で区別できない)。 */
    caption: Snippet;
    /** 列の見出し。列ごとに一度描かれる。 */
    header: Snippet<[TableColumn]>;
    /** セルの中身。行と列の組ごとに一度描かれる。 */
    cell: Snippet<[T, TableColumn]>;
    /** 行が0件のときに出す。枠だけが残ると、読み込み中なのか0件なのかが読めない。 */
    empty: Snippet;
    /** 選択の列と全選択のチェックボックスに与える名前(絵と枠だけの操作に名前を与える)。 */
    selectionLabel?: string;
    /** 行ごとの選択のチェックボックスに与える名前。行を特定できる文字列を返す。 */
    rowLabel?: (row: T) => string;
  }
  let {
    columns,
    rows,
    overflow = META.props.overflow.default,
    sticky = META.props.sticky.default,
    sort,
    selected,
    size = META.props.size.default,
    onsortchange,
    onselectedchange,
    onrowactivate,
    caption,
    header,
    cell,
    empty,
    selectionLabel = '選択',
    rowLabel,
  }: Props = $props();

  const uid = $props.id();
  // 選択の列は、値と受け口が揃ったときだけ現れる(真偽値の口を別に持たない。第3条)
  const selectable = $derived(!!selected && !!onselectedchange);
  const selectedSet = $derived(new Set(selected ?? []));
  const allSelected = $derived(rows.length > 0 && rows.every((r) => selectedSet.has(r.id)));
  const someSelected = $derived(!allSelected && rows.some((r) => selectedSet.has(r.id)));
  const columnCount = $derived(columns.length + (selectable ? 1 : 0));

  // 昇順 → 降順 → 解除。循環の回し方は Expressive(契約)
  const nextSort = (column: string): TableSort | null => {
    if (sort?.column !== column) return { column, direction: 'ascending' };
    if (sort.direction === 'ascending') return { column, direction: 'descending' };
    return null;
  };
  const ariaSort = (column: TableColumn) =>
    !column.sortable ? undefined : sort?.column === column.id ? sort.direction : 'none';

  const toggleRow = (id: string, on: boolean) => {
    const next = new Set(selectedSet);
    if (on) next.add(id);
    else next.delete(id);
    onselectedchange?.(rows.filter((r) => next.has(r.id)).map((r) => r.id));
  };
  const toggleAll = (on: boolean) => onselectedchange?.(on ? rows.map((r) => r.id) : []);

  // 行の押下は一次の行き先の活性化を指の操作から起こすだけである(行そのものは押せる要素ではない)。
  // 行の中の別の操作(チェックボックス・削除・メニュー)を押したときは起こさない: 押した相手が二つの
  // 意味を持つと、どちらが起きたのか読めない(Table.md §2)。
  const onrowclick = (e: MouseEvent, row: T) => {
    if (!onrowactivate) return;
    const hit = e.target as HTMLElement | null;
    if (hit?.closest('a, button, input, select, textarea, label, [role="button"]')) return;
    if (window.getSelection()?.toString()) return; // 文字を選んだだけの操作では起こさない
    onrowactivate(row.id);
  };

  // 送れる向きが残っているかを器が持つ。何も出さないと、貼り付いた列との境目が表の端に見えて
  // 続きがあることに気づけない(Table.md §2)。見せ方は CSS 側(Expressive)。
  let scroller = $state<HTMLElement>();
  let more = $state({ start: false, end: false });
  const measure = () => {
    const el = scroller;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const x = Math.abs(el.scrollLeft); // 行の向きが逆の言語では負で来る
    more = { start: x > 1, end: x < max - 1 };
  };
  $effect(() => {
    // rows / columns が変われば幅も変わる(読むことで依存にする)
    void rows.length;
    void columns.length;
    void overflow;
    measure();
    const el = scroller;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  });
</script>

<!-- 表の解剖: 名前(caption) / 見出しの行 / 本体。役割は native の table がそのまま持つ(第2条)。
     行に role は与えない。行全体を押せるのは指の操作の便宜で、意味論は行の中の要素が持つ。 -->
<div
  class="sc-table"
  data-size={size}
  data-overflow={overflow}
  data-sticky={sticky}
  data-more-start={more.start}
  data-more-end={more.end}
>
  <div class="sc-table-scroller" bind:this={scroller} onscroll={measure}>
    <table class="sc-table-grid">
      <caption class="sc-table-caption">{@render caption()}</caption>
      <thead>
        <tr>
          {#if selectable}
            <th scope="col" class="sc-table-selection">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onchange={(v) => toggleAll(v)}
              >
                {#snippet label()}<span class="sc-table-visually-hidden">{selectionLabel}</span>{/snippet}
              </Checkbox>
            </th>
          {/if}
          {#each columns as column (column.id)}
            <th scope="col" data-align={column.align ?? 'start'} aria-sort={ariaSort(column)}>
              {#if column.sortable}
                <!-- 並べ替えを要求するのは押せる要素である(見出しのセルそのものを押させない) -->
                <button
                  type="button"
                  class="sc-table-sort"
                  id={`${uid}-${column.id}`}
                  onclick={() => onsortchange?.(nextSort(column.id))}
                >
                  {@render header(column)}
                  <span class="sc-table-sort-mark" aria-hidden="true">
                    <Icon
                      name={sort?.column === column.id && sort.direction === 'descending'
                        ? 'chevron.down'
                        : 'chevron.up'}
                    />
                  </span>
                </button>
              {:else}
                {@render header(column)}
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#if rows.length === 0}
          <tr class="sc-table-empty">
            <td colspan={columnCount}>{@render empty()}</td>
          </tr>
        {:else}
          {#each rows as row (row.id)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <tr
              data-selected={selectedSet.has(row.id)}
              data-activatable={!!onrowactivate}
              onclick={(e) => onrowclick(e, row)}
            >
              {#if selectable}
                <td class="sc-table-selection">
                  <Checkbox
                    checked={selectedSet.has(row.id)}
                    onchange={(v) => toggleRow(row.id, v)}
                  >
                    {#snippet label()}
                      <span class="sc-table-visually-hidden">{rowLabel?.(row) ?? row.id}</span>
                    {/snippet}
                  </Checkbox>
                </td>
              {/if}
              {#each columns as column (column.id)}
                <td data-align={column.align ?? 'start'}>{@render cell(row, column)}</td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
