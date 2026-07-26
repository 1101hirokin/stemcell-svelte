import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Pagination from './Pagination.svelte';

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const previous = snip('前へ');
const next = snip('次へ');
const buttons = (c: HTMLElement) => [...c.querySelectorAll<HTMLButtonElement>('button')];

it('位置は視覚にも支援技術にも届く', () => {
  const { container } = render(Pagination, { props: { page: 3, pages: 12, previous, next } });
  const position = container.querySelector('[aria-current="page"]') as HTMLElement;
  expect(position.textContent).toBe('3 / 12');
});

it('端では行き先が無いので操作を無効にする(押せるのに何も起きない形にしない)', () => {
  const { container } = render(Pagination, { props: { page: 1, pages: 3, previous, next } });
  expect(buttons(container)[0]!.disabled).toBe(true);
  expect(buttons(container)[1]!.disabled).toBe(false);
  const { container: last } = render(Pagination, { props: { page: 3, pages: 3, previous, next } });
  expect(buttons(last)[0]!.disabled).toBe(false);
  expect(buttons(last)[1]!.disabled).toBe(true);
});

it('移動の要求を出す(値の更新はアプリ)', async () => {
  const onchange = vi.fn();
  const { container } = render(Pagination, { props: { page: 2, pages: 5, previous, next, onchange } });
  await fireEvent.click(buttons(container)[1]!);
  expect(onchange).toHaveBeenCalledWith(3);
  await fireEvent.click(buttons(container)[0]!);
  expect(onchange).toHaveBeenLastCalledWith(2);
});

it('頁が1つしか無ければ両端とも無効', () => {
  const { container } = render(Pagination, { props: { page: 1, pages: 1, previous, next } });
  expect(buttons(container).every((b) => b.disabled)).toBe(true);
});
