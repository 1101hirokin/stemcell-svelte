import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Rating from './Rating.svelte';

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const labels = ['5 段階中 1', '5 段階中 2', '5 段階中 3', '5 段階中 4', '5 段階中 5'];
const base = { label: snip('商品の評価'), itemLabels: labels };

it('読むだけの星は一つの絵として名前つきで届く(選択の集合にしない)', () => {
  const { container } = render(Rating, {
    props: { ...base, readonly: true, value: 4.2, valueLabel: '5 段階中 4.2' },
  });
  const img = container.querySelector('[role="img"]') as HTMLElement;
  expect(img.getAttribute('aria-label')).toBe('5 段階中 4.2');
  expect(container.querySelector('[role="radiogroup"]')).toBeNull();
  expect(container.querySelectorAll('input').length).toBe(0);
});

it('読み取りは連続でよい(平均点を整数へ丸めない)', () => {
  const { container } = render(Rating, {
    props: { ...base, readonly: true, value: 4.2, valueLabel: '5 段階中 4.2' },
  });
  const fill = container.querySelector('.sc-rating-fill') as HTMLElement;
  expect((container.querySelector('.sc-rating-stars') as HTMLElement).style.cssText).toContain('84%');
  expect(fill).not.toBeNull();
});

it('付ける星は段の集合になり、段ごとに名前を持つ', () => {
  const { container } = render(Rating, { props: { ...base, value: 3 } });
  const group = container.querySelector('[role="radiogroup"]') as HTMLElement;
  expect(group).not.toBeNull();
  const radios = [...container.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];
  expect(radios.length).toBe(5);
  expect(radios[2]!.checked).toBe(true);
  expect(container.querySelectorAll('.sc-rating-name')[1]!.textContent).toBe('5 段階中 2');
});

it('段を選ぶと値が変わる', async () => {
  const onchange = vi.fn();
  const { container } = render(Rating, { props: { ...base, value: 1, onchange } });
  const radios = [...container.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];
  await fireEvent.click(radios[3]!);
  expect(onchange).toHaveBeenLastCalledWith(4);
});

it('取り消しは既定で起きない', async () => {
  const onchange = vi.fn();
  const { container } = render(Rating, { props: { ...base, value: 2, onchange } });
  const radios = [...container.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];
  await fireEvent.click(radios[1]!);
  expect(onchange).toHaveBeenLastCalledWith(2);
});

it('取り消しを許すと押し直しでも鍵盤でも消える(ポインタ専用にしない)', async () => {
  const onchange = vi.fn();
  const { container } = render(Rating, { props: { ...base, value: 2, allowClear: true, onchange } });
  const radios = [...container.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];
  await fireEvent.click(radios[1]!);
  expect(onchange).toHaveBeenLastCalledWith(null);
  const group = container.querySelector('[role="radiogroup"]') as HTMLElement;
  await fireEvent.click(radios[3]!);
  await fireEvent.keyDown(group, { key: 'Delete' });
  expect(onchange).toHaveBeenLastCalledWith(null);
});

it('読み取りに名前が無いと警告する(絵として届く器に名前が要る)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(Rating, { props: { ...base, readonly: true, value: 3 } });
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('valueLabel が要る'));
  warn.mockRestore();
});

it('入力で段の名前が足りないと警告する', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(Rating, { props: { label: snip('評価'), itemLabels: ['1'] } });
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('itemLabels'));
  warn.mockRestore();
});

it('名前を視覚から隠しても、名前は残る(読み取りでも入力でも)', () => {
  const read = render(Rating, {
    props: { ...base, readonly: true, value: 4, valueLabel: '5 段階中 4', labelHidden: true },
  });
  const readRoot = read.container.querySelector('.sc-rating') as HTMLElement;
  expect(readRoot.dataset.labelHidden).toBe('true');
  expect(readRoot.querySelector('.sc-rating-label')!.textContent).toContain('商品の評価');
  expect(readRoot.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('5 段階中 4');

  const input = render(Rating, { props: { ...base, value: 3, labelHidden: true } });
  const group = input.container.querySelector('[role="radiogroup"]') as HTMLElement;
  expect(group.dataset.labelHidden).toBe('true');
  const named = input.container.querySelector(`#${group.getAttribute('aria-labelledby')}`);
  expect(named?.textContent).toContain('商品の評価');
});
