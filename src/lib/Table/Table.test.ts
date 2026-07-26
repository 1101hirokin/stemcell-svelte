import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Table from './Table.svelte';
import type { TableColumn } from './meta';

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const columns: TableColumn[] = [
  { id: 'name' },
  { id: 'amount', align: 'end', sortable: true },
];
type Row = { id: string; name: string; amount: number };
const rows: Row[] = [
  { id: 'a', name: '朝顔', amount: 1200 },
  { id: 'b', name: '向日葵', amount: 980 },
];
const props = {
  columns,
  rows,
  caption: snip('注文'),
  header: createRawSnippet((column: () => TableColumn) => ({
    render: () => `<span>${column().id}</span>`,
  })),
  cell: createRawSnippet((row: () => Row, column: () => TableColumn) => ({
    render: () => `<span>${String(row()[column().id as 'name'])}</span>`,
  })),
  empty: snip('注文はまだありません'),
};

const q = <T extends HTMLElement>(c: HTMLElement, s: string) => c.querySelector(s) as T;
const all = (c: HTMLElement, s: string) => [...c.querySelectorAll<HTMLElement>(s)];

it('表の構造(名前・見出し・本体)を器が持つ', () => {
  const { container } = render(Table<Row>, { props });
  expect(q(container, 'caption').textContent).toContain('注文');
  expect(all(container, 'thead th').map((th) => th.getAttribute('scope'))).toEqual(['col', 'col']);
  expect(all(container, 'tbody tr').length).toBe(2);
  // セルは焦点を受けない(表であって grid ではない)
  expect(container.querySelector('[role="grid"]')).toBeNull();
  expect(container.querySelector('td[tabindex]')).toBeNull();
});

it('行が0件のときは empty を出す', () => {
  const { container } = render(Table<Row>, { props: { ...props, rows: [] as Row[] } });
  expect(container.textContent).toContain('注文はまだありません');
  expect(q(container, 'tbody td').getAttribute('colspan')).toBe('2');
});

it('桁で読む列は行末側へ寄せる', () => {
  const { container } = render(Table<Row>, { props });
  const cells = all(container, 'tbody tr:first-child td');
  expect(cells[0]!.dataset.align).toBe('start');
  expect(cells[1]!.dataset.align).toBe('end');
});

// 並べ替えは要求で、器は並べ替えない(Table.md §2)
it('並べ替えを要求する。昇順 → 降順 → 解除で回る', async () => {
  const onsortchange = vi.fn();
  const { container, rerender } = render(Table<Row>, { props: { ...props, onsortchange } });
  const button = q(container, '.sc-table-sort');
  await fireEvent.click(button);
  expect(onsortchange).toHaveBeenLastCalledWith({ column: 'amount', direction: 'ascending' });

  await rerender({ ...props, onsortchange, sort: { column: 'amount', direction: 'ascending' } });
  await fireEvent.click(q(container, '.sc-table-sort'));
  expect(onsortchange).toHaveBeenLastCalledWith({ column: 'amount', direction: 'descending' });

  await rerender({ ...props, onsortchange, sort: { column: 'amount', direction: 'descending' } });
  await fireEvent.click(q(container, '.sc-table-sort'));
  expect(onsortchange).toHaveBeenLastCalledWith(null);
});

it('並べ替えている列を見出しで表明する', async () => {
  const { container } = render(Table<Row>, {
    props: { ...props, sort: { column: 'amount', direction: 'descending' as const } },
  });
  const [name, amount] = all(container, 'thead th');
  expect(name!.getAttribute('aria-sort')).toBeNull(); // 並べ替えられない列には立てない
  expect(amount!.getAttribute('aria-sort')).toBe('descending');
});

it('並べ替えない列は器も並べ替えない(行の順は渡されたまま)', () => {
  const { container } = render(Table<Row>, { props });
  expect(all(container, 'tbody tr').map((tr) => tr.textContent)).toEqual([
    expect.stringContaining('朝顔'),
    expect.stringContaining('向日葵'),
  ]);
});

// 選択は値で、口は値と受け口が揃ったときだけ現れる(第3条)
it('選択の値と受け口が揃ったときだけ選択の列が出る', () => {
  const { container } = render(Table<Row>, { props });
  expect(container.querySelector('.sc-table-selection')).toBeNull();

  const { container: c2 } = render(Table<Row>, {
    props: { ...props, selected: [], onselectedchange: vi.fn() },
  });
  expect(all(c2, '.sc-table-selection').length).toBe(3); // 見出し + 行2つ
});

it('行を選ぶと集合で知らせる。選ばれた行は見た目でも分かる', async () => {
  const onselectedchange = vi.fn();
  const { container } = render(Table<Row>, { props: { ...props, selected: ['a'], onselectedchange } });
  expect(all(container, 'tbody tr')[0]!.dataset.selected).toBe('true');
  expect(all(container, 'tbody tr')[1]!.dataset.selected).toBe('false');
  // 行に aria-selected は立てない(選択を伝えるのはチェックボックス)
  expect(container.querySelector('tr[aria-selected]')).toBeNull();

  const boxes = all(container, 'tbody input[type="checkbox"]');
  await fireEvent.click(boxes[1]!);
  expect(onselectedchange).toHaveBeenLastCalledWith(['a', 'b']);
});

it('全選択は、一部だけ選ばれているとき indeterminate になる', async () => {
  const onselectedchange = vi.fn();
  const { container } = render(Table<Row>, { props: { ...props, selected: ['a'], onselectedchange } });
  const head = q<HTMLInputElement>(container, 'thead input[type="checkbox"]');
  expect(head.indeterminate).toBe(true);
  await fireEvent.click(head);
  expect(onselectedchange).toHaveBeenLastCalledWith(['a', 'b']);
});

// 行の押下は一次の行き先の活性化を指の操作から起こすだけである(Table.md §2)
it('行の押下で行の id を返す', async () => {
  const onrowactivate = vi.fn();
  const { container } = render(Table<Row>, { props: { ...props, onrowactivate } });
  await fireEvent.click(all(container, 'tbody td')[0]!);
  expect(onrowactivate).toHaveBeenCalledWith('a');
});

it('行の中の操作を押したときは行の押下を起こさない', async () => {
  const onrowactivate = vi.fn();
  const onselectedchange = vi.fn();
  const { container } = render(Table<Row>, {
    props: { ...props, onrowactivate, selected: [], onselectedchange },
  });
  await fireEvent.click(all(container, 'tbody input[type="checkbox"]')[0]!);
  expect(onselectedchange).toHaveBeenCalledWith(['a']);
  expect(onrowactivate).not.toHaveBeenCalled();
});

it('折り返しと貼り付きを器が持つ', () => {
  const { container } = render(Table<Row>, { props: { ...props, overflow: 'wrap', sticky: 'both' } });
  const root = q(container, '.sc-table');
  expect(root.dataset.overflow).toBe('wrap');
  expect(root.dataset.sticky).toBe('both');
});
