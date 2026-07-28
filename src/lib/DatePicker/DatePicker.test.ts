import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { vi } from 'vitest';
import DatePicker from './DatePicker.svelte';

const label = createRawSnippet(() => ({ render: () => '<span>納品日</span>' }));
const props = { label, calendarLabel: '暦を開く' };

it('欄と、暦を開く操作を持つ', () => {
  const { container } = render(DatePicker, { props });
  expect(container.querySelector('.sc-datefield')).not.toBeNull();
  const trigger = container.querySelector('button') as HTMLElement;
  expect(trigger.getAttribute('aria-label')).toBe('暦を開く');
});

it('暦が開いているかは部品が内部で持つ。トリガーがその状態を告げる', async () => {
  const { container } = render(DatePicker, { props: { ...props, value: '2026-07-20' } });
  const trigger = container.querySelector('button') as HTMLElement;
  expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  await fireEvent.click(trigger);
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
});

it('欄で打った日が値になる', async () => {
  const onchange = vi.fn();
  const { container } = render(DatePicker, { props: { ...props, value: '2026-07-20', onchange } });
  const month = container.querySelector('[data-segment="month"]') as HTMLElement;
  await fireEvent.keyDown(month, { key: 'ArrowUp' });
  expect(onchange).toHaveBeenCalledWith('2026-08-20');
});

it('無効のときは暦を開けない', () => {
  const { container } = render(DatePicker, { props: { ...props, disabled: true } });
  expect((container.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
});
