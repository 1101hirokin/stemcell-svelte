import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import NumberField from './NumberField.svelte';

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const base = {
  label: snip('数量'),
  incrementLabel: '一つ増やす',
  decrementLabel: '一つ減らす',
};
const input = (c: HTMLElement) => c.querySelector('.sc-numberfield-input') as HTMLInputElement;

it('打てる欄に数の意味論が載る(native の type=number は使わない)', () => {
  const { container } = render(NumberField, { props: { ...base, value: 3 } });
  const el = input(container);
  expect(el.type).toBe('text');
  expect(el.getAttribute('role')).toBe('spinbutton');
  expect(el.getAttribute('inputmode')).toBe('numeric');
  expect(el.value).toBe('3');
});

it('境界を伝える', () => {
  const { container } = render(NumberField, { props: { ...base, value: 3, min: 0, max: 10 } });
  const el = input(container);
  expect(el.getAttribute('aria-valuenow')).toBe('3');
  expect(el.getAttribute('aria-valuemin')).toBe('0');
  expect(el.getAttribute('aria-valuemax')).toBe('10');
});

it('上で増え、下で減る(PageUp / PageDown は大きく動く)', async () => {
  const onchange = vi.fn();
  const { container } = render(NumberField, { props: { ...base, value: 3, onchange } });
  const el = input(container);
  await fireEvent.keyDown(el, { key: 'ArrowUp' });
  expect(onchange).toHaveBeenLastCalledWith(4);
  await fireEvent.keyDown(el, { key: 'ArrowDown' });
  expect(onchange).toHaveBeenLastCalledWith(3);
  await fireEvent.keyDown(el, { key: 'PageUp' });
  expect(onchange).toHaveBeenLastCalledWith(13);
});

it('Home と End は文字の移動に残す(打てる欄なので値へ飛ばさない)', async () => {
  const onchange = vi.fn();
  const { container } = render(NumberField, { props: { ...base, value: 3, min: 0, max: 10, onchange } });
  await fireEvent.keyDown(input(container), { key: 'Home' });
  await fireEvent.keyDown(input(container), { key: 'End' });
  expect(onchange).not.toHaveBeenCalled();
});

it('境界を越えない', async () => {
  const onchange = vi.fn();
  const { container } = render(NumberField, { props: { ...base, value: 10, max: 10, onchange } });
  await fireEvent.keyDown(input(container), { key: 'ArrowUp' });
  expect(onchange).toHaveBeenLastCalledWith(10);
});

it('増減はタブ順から外れ、名前を持つ', () => {
  const { container } = render(NumberField, { props: { ...base, value: 1 } });
  const steppers = [...container.querySelectorAll('.sc-numberfield-stepper')] as HTMLButtonElement[];
  expect(steppers.length).toBe(2);
  expect(steppers.map((b) => b.tabIndex)).toEqual([-1, -1]);
  // 並びは減らす → 欄 → 増やす(横に並べるのは当たり判定のため。縦に積むと 24px を割る)
  expect(steppers[0]!.getAttribute('aria-label')).toBe('一つ減らす');
  expect(steppers[1]!.getAttribute('aria-label')).toBe('一つ増やす');
});

it('空は値が無いことであって 0 ではない', async () => {
  const onchange = vi.fn();
  const { container } = render(NumberField, { props: { ...base, value: 5, onchange } });
  await fireEvent.input(input(container), { target: { value: '' } });
  expect(onchange).toHaveBeenLastCalledWith(null);
});

it('値に直せない途中の入力では値を作らない', async () => {
  const onchange = vi.fn();
  const { container } = render(NumberField, { props: { ...base, keyboard: 'decimal', onchange } });
  await fireEvent.input(input(container), { target: { value: '-' } });
  expect(onchange).not.toHaveBeenCalled();
  await fireEvent.input(input(container), { target: { value: '-1.5' } });
  expect(onchange).toHaveBeenLastCalledWith(-1.5);
});

it('name を渡すとフォーム送信に値が載る(打てる欄が text なので隠しの欄が運ぶ)', () => {
  const { container } = render(NumberField, { props: { ...base, name: 'quantity', value: 7 } });
  const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
  expect(hidden.name).toBe('quantity');
  expect(hidden.value).toBe('7');
});

it('名前を視覚から隠しても、名前は残る(消えるのは見た目だけ)', () => {
  const { container } = render(NumberField, { props: { ...base, value: 2, labelHidden: true } });
  const root = container.querySelector('.sc-numberfield') as HTMLElement;
  const label = container.querySelector('.sc-numberfield-label') as HTMLElement;
  expect(root.dataset.labelHidden).toBe('true');
  // 名前の要素は残り、欄との結びも切れない(display:none にしない)
  expect(label).not.toBeNull();
  expect(label.getAttribute('for')).toBe(input(container).id);
  expect(label.textContent).toContain('数量');
});

it('境界に達したことを伝える(何も知らせない形は採らない。裁定 2026-07-28)', () => {
  const { container } = render(NumberField, {
    props: {
      label: snip('<span>数量</span>'),
      value: 5,
      max: 5,
      min: 0,
      incrementLabel: '増やす',
      decrementLabel: '減らす',
    },
  });
  const steppers = [...container.querySelectorAll('.sc-numberfield-stepper')] as HTMLButtonElement[];
  const up = steppers[1];
  expect(up.disabled).toBe(true); // svelte は無効にする形で伝える(伝え方は Expressive)
  expect(steppers[0].disabled).toBe(false);
});
