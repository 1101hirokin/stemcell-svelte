/**
 * 実装側テスト。独立設定の on/off(field.md §7)。role=switch・Space 切替・値の所有・
 * 部分集合の選択(invalid/indeterminate/required を持たない)を検証する。
 */
import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Switch from './Switch.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const label = snip('<span>通知</span>');
const input = (c: HTMLElement) => c.querySelector('.sc-switch-input') as HTMLInputElement;

it('role=switch で描画され、label が配線される(field.md §2)', () => {
  const { container } = render(Switch, { props: { label } });
  const el = input(container);
  expect(el.getAttribute('role')).toBe('switch');
  expect((container.querySelector('.sc-switch-label') as HTMLElement).textContent).toContain('通知');
});

it('change: 切替で発火し payload は新しい checked(即時反映。field.md §5/§7)', async () => {
  const onchange = vi.fn();
  const { container } = render(Switch, { props: { label, onchange } });
  await fireEvent.click(input(container));
  expect(onchange).toHaveBeenCalledWith(true);
});

it('値の所有: checked prop の更新は DOM へ流れる(field.md §5)', async () => {
  const { container, rerender } = render(Switch, { props: { label, checked: false } });
  expect(input(container).checked).toBe(false);
  await rerender({ label, checked: true });
  expect(input(container).checked).toBe(true);
});

it('部分集合の選択: invalid / indeterminate / required を持たない(state.md §4。契約)', () => {
  const { container } = render(Switch, { props: { label } });
  const el = input(container);
  // aria-invalid を出さない。indeterminate property も false のまま
  expect(el.getAttribute('aria-invalid')).toBeNull();
  expect(el.indeterminate).toBe(false);
  expect(el.required).toBe(false);
});

it('description は aria-describedby で説明として届く(field.md §2)', () => {
  const { container } = render(Switch, { props: { label, description: snip('<span>メールで受け取る</span>') } });
  const desc = container.querySelector('.sc-switch-description') as HTMLElement;
  expect(input(container).getAttribute('aria-describedby')).toBe(desc.id);
});

it('disabled: native 属性で届く(抑制は native + smoke。state.md §5)', () => {
  const { container } = render(Switch, { props: { label, disabled: true } });
  expect(input(container).disabled).toBe(true);
  expect((container.querySelector('.sc-switch-field') as HTMLElement).dataset.disabled).toBe('true');
});
