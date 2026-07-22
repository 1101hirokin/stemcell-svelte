/**
 * 実装側テスト。グループ解剖(値はグループが所有・error はグループに帰属・項目は Radio)を
 * Radio と組み合わせて検証する。矢印キー・roving tabindex の実測は smoke(native の挙動)。
 */
import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Harness from './fixtures/Harness.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const inputs = (c: HTMLElement) => [...c.querySelectorAll('.sc-radio-input')] as HTMLInputElement[];

it('項目は共有 name の native radio で束ねられ、選択は value 一致から導かれる(checked prop なし)', () => {
  const { container } = render(Harness, { props: { value: 'b' } });
  const els = inputs(container);
  expect(els.every((e) => e.type === 'radio')).toBe(true);
  expect(new Set(els.map((e) => e.name)).size, '共有 name').toBe(1);
  expect(els.map((e) => e.checked)).toEqual([false, true, false]); // value=b が選ばれている
});

it('change: 項目の選択でグループが発火し payload は新しい value(field.md §5)', async () => {
  const onchange = vi.fn();
  const { container } = render(Harness, { props: { onchange } });
  await fireEvent.click(inputs(container)[0]!);
  expect(onchange).toHaveBeenCalledWith('a');
});

it('値の所有: グループの value 更新で選択が DOM へ流れる(項目は checked を持たない)', async () => {
  const { container, rerender } = render(Harness, { props: { value: 'a' } });
  expect(inputs(container).map((e) => e.checked)).toEqual([true, false, false]);
  await rerender({ value: 'c' });
  expect(inputs(container).map((e) => e.checked)).toEqual([false, false, true]);
});

it('グループの label は集合の名前として fieldset/legend と aria-labelledby で配線される(WCAG 1.3.1)', () => {
  const { container } = render(Harness, {});
  const fs = container.querySelector('.sc-radiogroup') as HTMLElement;
  expect(fs.tagName).toBe('FIELDSET');
  const legend = container.querySelector('.sc-radiogroup-label') as HTMLElement;
  expect(fs.getAttribute('aria-labelledby')).toBe(legend.id);
});

it('invalid×選択済み: CSS の invalid override が :checked の枠再宣言に潰されない配線がある(独立レビュー blocker)', () => {
  // 実際の色は smoke が実 Chromium で測る。ここでは選択済み項目にも data-invalid が降りていることを確認
  const { container } = render(Harness, { props: { value: 'b', invalid: true } });
  const fields = [...container.querySelectorAll('.sc-radio-field')] as HTMLElement[];
  const checkedField = fields[1]!; // value=b が選択済み
  expect((checkedField.querySelector('.sc-radio-input') as HTMLInputElement).checked).toBe(true);
  expect(checkedField.dataset.invalid, '選択済み項目にも invalid が降りる').toBe('true');
});

it('invalid はグループの状態として届き、danger が項目へ降りる(Radio は invalid prop を持たない)', () => {
  const { container } = render(Harness, { props: { invalid: true, error: snip('<span>選択が必要</span>') } });
  const fs = container.querySelector('.sc-radiogroup') as HTMLElement;
  expect(fs.getAttribute('aria-invalid')).toBe('true');
  expect(fs.dataset.invalid).toBe('true');
  // error はグループに1つ、項目には data-invalid が降りる
  expect(container.querySelector('.sc-radiogroup-error')?.textContent).toContain('選択が必要');
  expect((container.querySelector('.sc-radio-field') as HTMLElement).dataset.invalid).toBe('true');
});

it('required: 視覚標示はグループの label に出て aria-required が届く(field.md §4)', () => {
  const { container } = render(Harness, { props: { required: true } });
  expect((container.querySelector('.sc-radiogroup') as HTMLElement).getAttribute('aria-required')).toBe('true');
  const marker = container.querySelector('.sc-radiogroup-required') as HTMLElement;
  expect(marker.getAttribute('aria-hidden')).toBe('true');
});

it('グループの disabled は項目へ降り、項目個別の disabled も独立に立つ(state.md §3.1)', () => {
  const { container } = render(Harness, { props: { disabled: true } });
  expect(inputs(container).every((e) => e.disabled), 'グループ disabled が全項目へ').toBe(true);
  const { container: c2 } = render(Harness, { props: { disabledItem: 'b' } });
  expect(inputs(c2).map((e) => e.disabled)).toEqual([false, true, false]); // b だけ無効
});

it('description と error は両方が aria-describedby でグループに届く(field.md §3。並置)', () => {
  const { container } = render(Harness, {
    props: { invalid: true, description: snip('<span>ひとつ選ぶ</span>'), error: snip('<span>未選択</span>') },
  });
  const fs = container.querySelector('.sc-radiogroup') as HTMLElement;
  const ids = (fs.getAttribute('aria-describedby') ?? '').split(' ');
  expect(ids).toContain(container.querySelector('.sc-radiogroup-description')!.id);
  expect(ids).toContain(container.querySelector('.sc-radiogroup-error')!.id);
});
