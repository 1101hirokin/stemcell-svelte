import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Combobox from './Combobox.svelte';

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const options = [
  { value: 'a', label: '朝日商会' },
  { value: 'b', label: '向日葵デザイン' },
  { value: 'c', label: '南風製作所', disabled: true },
];
const base = {
  label: snip('取引先'),
  options,
  emptyLabel: '該当する取引先がありません',
  countLabel: '{n} 件',
};
const input = (c: HTMLElement) => c.querySelector('.sc-combobox-input') as HTMLInputElement;

it('打てる欄自身が combobox である(ARIA 1.2)', () => {
  const { container } = render(Combobox, { props: base });
  const el = input(container);
  expect(el.getAttribute('role')).toBe('combobox');
  expect(el.getAttribute('aria-expanded')).toBe('false');
  expect(el.getAttribute('aria-autocomplete')).toBe('list');
});

it('打つと候補が開き、打った文字を知らせる(器は絞らない)', async () => {
  const oninputchange = vi.fn();
  const { container } = render(Combobox, { props: { ...base, oninputchange } });
  await fireEvent.input(input(container), { target: { value: '朝' } });
  expect(oninputchange).toHaveBeenLastCalledWith('朝');
  expect(input(container).getAttribute('aria-expanded')).toBe('true');
  // 器は options をそのまま出す(絞り込みは消費者の仕事)
  expect(container.querySelectorAll('[role="option"]').length).toBe(3);
});

it('矢印で候補を辿り、Enter で選ぶ(焦点は欄に留まる)', async () => {
  const onchange = vi.fn();
  const { container } = render(Combobox, { props: { ...base, onchange } });
  const el = input(container);
  await fireEvent.keyDown(el, { key: 'ArrowDown' });
  expect(el.getAttribute('aria-activedescendant')).toBeTruthy();
  await fireEvent.keyDown(el, { key: 'ArrowDown' });
  await fireEvent.keyDown(el, { key: 'Enter' });
  expect(onchange).toHaveBeenLastCalledWith('b');
  expect(el.value).toBe('向日葵デザイン');
});

it('選べない候補は飛ばす', async () => {
  const onchange = vi.fn();
  const { container } = render(Combobox, { props: { ...base, onchange } });
  const el = input(container);
  await fireEvent.keyDown(el, { key: 'ArrowDown' }); // まず開く
  await fireEvent.keyDown(el, { key: 'End' });
  await fireEvent.keyDown(el, { key: 'Enter' });
  // 三つ目は選べないので、末尾は二つ目になる
  expect(onchange).toHaveBeenLastCalledWith('b');
});

it('打っている間は候補を先に選ばない(見ていない相手を Enter で選ばせない)', async () => {
  const onchange = vi.fn();
  const { container } = render(Combobox, { props: { ...base, onchange } });
  const el = input(container);
  await fireEvent.keyDown(el, { key: 'ArrowDown' }); // 開くと選ばれている位置に仮の焦点が付く
  await fireEvent.input(el, { target: { value: '朝' } });
  expect(el.getAttribute('aria-activedescendant')).toBe(null);
  await fireEvent.keyDown(el, { key: 'Enter' });
  expect(onchange).not.toHaveBeenCalled();
});

it('絞り込みで候補から外れても、選んだ相手の名前へ戻せる', async () => {
  const oninputchange = vi.fn();
  const { container, rerender } = render(Combobox, {
    props: { ...base, value: 'a', inputValue: '朝日商会', oninputchange },
  });
  const el = input(container);
  await fireEvent.input(el, { target: { value: '南' } });
  await rerender({ ...base, options: [options[2]], value: 'a', inputValue: '南', oninputchange }); // 候補が入れ替わる
  await fireEvent.blur(el);
  expect(el.value).toBe('朝日商会');
});

it('打った文字は値ではない(閉じたら選ばれている値へ戻す)', async () => {
  const onchange = vi.fn();
  const oninputchange = vi.fn();
  const { container } = render(Combobox, {
    props: { ...base, value: 'a', inputValue: '朝日商会', onchange, oninputchange },
  });
  const el = input(container);
  await fireEvent.input(el, { target: { value: '南' } });
  await fireEvent.keyDown(el, { key: 'Escape' });
  expect(oninputchange).toHaveBeenLastCalledWith('朝日商会');
  expect(onchange).not.toHaveBeenCalled();
});

it('何も選んでいなければ、閉じたときに空へ戻す', async () => {
  const oninputchange = vi.fn();
  const { container } = render(Combobox, { props: { ...base, oninputchange } });
  const el = input(container);
  await fireEvent.input(el, { target: { value: '南' } });
  await fireEvent.blur(el);
  expect(oninputchange).toHaveBeenLastCalledWith('');
});

it('候補が無いときは空の一覧を出さずに言葉で伝える', async () => {
  const { container } = render(Combobox, { props: { ...base, options: [] } });
  await fireEvent.keyDown(input(container), { key: 'ArrowDown' });
  expect(container.querySelector('.sc-combobox-empty')?.textContent).toBe('該当する取引先がありません');
  expect(container.querySelectorAll('[role="option"]').length).toBe(0);
});

it('件数は器が告げる(0 件も件数である)', async () => {
  const { container } = render(Combobox, { props: { ...base, options: [] } });
  const live = container.querySelector('.sc-combobox-count') as HTMLElement;
  expect(live.getAttribute('role')).toBe('status');
  await fireEvent.keyDown(input(container), { key: 'ArrowDown' });
  expect(live.textContent).toBe('0 件');
});

it('name を渡すとフォーム送信に値が載る', () => {
  const { container } = render(Combobox, { props: { ...base, name: 'partner', value: 'b' } });
  const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
  expect(hidden.name).toBe('partner');
  expect(hidden.value).toBe('b');
});
