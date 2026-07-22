/**
 * 実装側テスト。適合テストが照合できない配線と挙動を検証する:
 * リッチ label の二重発火防止(契約 a11y の核心。field.md §6)、indeterminate の第三の値、
 * change の payload(boolean)、値の所有、a11y 配線。
 * 二重発火の実機確認(native label のトグル転送抑制)は smoke が実 Chromium で行う。
 */
import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Checkbox from './Checkbox.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const label = snip('<span>利用規約に同意する</span>');
const box = (c: HTMLElement) => c.querySelector('.sc-checkbox-input') as HTMLInputElement;

it('checkbox role で描画され、label の内容がアクセシブルネームを構成する(field.md §6)', () => {
  const { container } = render(Checkbox, { props: { label } });
  const input = box(container);
  expect(input.type).toBe('checkbox');
  const lbl = container.querySelector('.sc-checkbox-label') as HTMLElement;
  expect(lbl.textContent).toContain('利用規約に同意する');
});

it('change: 切替で発火し payload は新しい checked(field.md §5)', async () => {
  const onchange = vi.fn();
  const { container } = render(Checkbox, { props: { label, onchange } });
  await fireEvent.click(box(container));
  expect(onchange).toHaveBeenCalledWith(true);
});

it('indeterminate: aria-checked=mixed を出すが checked の値は変えない(state.md §6)', () => {
  const { container } = render(Checkbox, { props: { label, indeterminate: true } });
  const input = box(container);
  expect(input.indeterminate).toBe(true);
  expect(input.checked).toBe(false);
});

it('indeterminate: 切替で下ろされ、change の payload は新しい checked(契約 events)', async () => {
  const onchange = vi.fn();
  const { container } = render(Checkbox, { props: { label, indeterminate: true, onchange } });
  await fireEvent.click(box(container));
  expect(onchange).toHaveBeenCalledWith(true);
  expect(box(container).indeterminate).toBe(false);
});

it('リッチ label 内のリンク活性化は切替を発火させない(二重発火防止。契約 a11y)', async () => {
  const onchange = vi.fn();
  const richLabel = snip('<span>利用規約(<a href="/terms" data-testid="link">全文</a>)に同意</span>');
  const { container, getByTestId } = render(Checkbox, { props: { label: richLabel, onchange } });
  const link = getByTestId('link');
  // リンククリックはリンク自身の活性化であってチェックの切替ではない
  await fireEvent.click(link);
  expect(onchange, 'リンク活性化が切替を発火させた(二重発火)').not.toHaveBeenCalled();
  expect(box(container).checked).toBe(false);
});

it('invalid: aria-invalid が届き、intent が danger へ差し替わる(data-invalid)', () => {
  const { container } = render(Checkbox, { props: { label, invalid: true } });
  expect(box(container).getAttribute('aria-invalid')).toBe('true');
  expect((container.querySelector('.sc-checkbox-field') as HTMLElement).dataset.invalid).toBe('true');
});

it('error は invalid のときだけ現れ、description と両方が aria-describedby で届く(field.md §3)', () => {
  const { container } = render(Checkbox, {
    props: { label, invalid: true, description: snip('<span>必須の同意</span>'), error: snip('<span>同意が必要</span>') },
  });
  const desc = container.querySelector('.sc-checkbox-description') as HTMLElement;
  const err = container.querySelector('.sc-checkbox-error') as HTMLElement;
  const ids = (box(container).getAttribute('aria-describedby') ?? '').split(' ');
  expect(ids).toContain(desc.id);
  expect(ids).toContain(err.id);
  // invalid=false なら error は出ない
  const { container: c2 } = render(Checkbox, { props: { label, invalid: false, error: snip('<span>x</span>') } });
  expect(c2.querySelector('.sc-checkbox-error')).toBeNull();
});

it('required: native 属性で届き、視覚標示を部品が出す(field.md §4)', () => {
  const { container } = render(Checkbox, { props: { label, required: true } });
  expect(box(container).required).toBe(true);
  const marker = container.querySelector('.sc-checkbox-required') as HTMLElement;
  expect(marker.getAttribute('aria-hidden')).toBe('true');
});

it('disabled: native 属性で届く(活性化の抑制は native の保証。state.md §5・HOLES #3)', () => {
  // jsdom は disabled input への合成 click でも change を発火させるため、抑制の実挙動は
  // native 属性に委ね(実ブラウザは click を無視)、smoke が実 Chromium で確認する。
  const { container } = render(Checkbox, { props: { label, disabled: true } });
  expect(box(container).disabled).toBe(true);
  expect((container.querySelector('.sc-checkbox-field') as HTMLElement).dataset.disabled).toBe('true');
});

it('値の所有: checked prop の更新は DOM へ流れる(field.md §5)', async () => {
  const { container, rerender } = render(Checkbox, { props: { label, checked: false } });
  expect(box(container).checked).toBe(false);
  await rerender({ label, checked: true });
  expect(box(container).checked).toBe(true);
});
