import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { beforeEach, vi } from 'vitest';
import Pagination from './Pagination.svelte';

// 合成した Select は指の粗さで経路を選ぶ(RFC 0007 の B2)。jsdom に matchMedia が無いので、
// pointer 経路(custom combobox)側に固定する。Select.test.ts と同じ差し替え。
beforeEach(() => {
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const previous = snip('前へ');
const next = snip('次へ');
const label = snip('ページ送り');
const props = { previous, next, label };
const buttons = (c: HTMLElement) => [...c.querySelectorAll<HTMLButtonElement>('.sc-pagination > button')];
const jump = (c: HTMLElement) => c.querySelector('.sc-pagination-jump') as HTMLElement;

it('領域の名前は必須で、中央の欄の名前も兼ねる(無名の欄を許さない)', () => {
  const { container } = render(Pagination, { props: { ...props, page: 1, pages: 3 } });
  const nav = container.querySelector('nav') as HTMLElement;
  const id = nav.getAttribute('aria-labelledby');
  expect(container.querySelector(`#${id}`)?.textContent).toBe('ページ送り');
  // 中央の欄にも同じ名前が付き、視覚からは隠れる
  const select = jump(container).querySelector('.sc-select') as HTMLElement;
  expect(select.dataset.labelHidden).toBe('true');
  expect(select.querySelector('.sc-select-label')?.textContent).toContain('ページ送り');
});

it('中央は現在地の表示であると同時に行き先の選択(番号の列を持たない)', () => {
  const { container } = render(Pagination, { props: { ...props, page: 3, pages: 9 } });
  // 閉じているトリガーがそのまま現在地を語る
  const trigger = jump(container).querySelector('[role="combobox"]') as HTMLElement;
  expect(trigger.textContent).toContain('3 / 9');
  // 頁の数だけ増えるのは選択肢であって、押せる印ではない
  expect(buttons(container).length).toBe(2);
});

it('端では行き先が無いので操作を無効にする(押せるのに何も起きない形にしない)', () => {
  const { container } = render(Pagination, { props: { ...props, page: 1, pages: 3 } });
  expect(buttons(container)[0]!.disabled).toBe(true);
  expect(buttons(container)[1]!.disabled).toBe(false);
  const { container: last } = render(Pagination, { props: { ...props, page: 3, pages: 3 } });
  expect(buttons(last)[0]!.disabled).toBe(false);
  expect(buttons(last)[1]!.disabled).toBe(true);
});

it('移動の要求を出す(値の更新はアプリ)', async () => {
  const onchange = vi.fn();
  const { container } = render(Pagination, { props: { ...props, page: 2, pages: 5, onchange } });
  await fireEvent.click(buttons(container)[1]!);
  expect(onchange).toHaveBeenCalledWith(3);
  await fireEvent.click(buttons(container)[0]!);
  expect(onchange).toHaveBeenLastCalledWith(2);
});

it('選択でも移動の要求が出る(任意の頁へ飛べる)', async () => {
  const onchange = vi.fn();
  const { container } = render(Pagination, { props: { ...props, page: 1, pages: 9, onchange } });
  const trigger = jump(container).querySelector('[role="combobox"]') as HTMLElement;
  // 開いて(現在の頁が active)、6つ下って 7 頁目で確定する(web-keys arrows.listbox)
  await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  for (let i = 0; i < 6; i++) await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  await fireEvent.keyDown(trigger, { key: 'Enter' });
  expect(onchange).toHaveBeenCalledWith(7);
});

it('頁が1つしか無ければ前後も選択も無効', () => {
  const { container } = render(Pagination, { props: { ...props, page: 1, pages: 1 } });
  expect(buttons(container).every((b) => b.disabled)).toBe(true);
  expect((jump(container).querySelector('.sc-select') as HTMLElement).dataset.disabled).toBe('true');
});
