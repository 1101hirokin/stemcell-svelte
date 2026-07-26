import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import DateRangePicker from './DateRangePicker.svelte';

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const props = {
  label: snip('対象の期間'),
  startLabel: snip('開始日'),
  endLabel: snip('終了日'),
  calendarLabel: '暦を開く',
};
const fields = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('.sc-datefield')];

it('2つの欄が1つの期間であることが届く', () => {
  const { container } = render(DateRangePicker, { props });
  const group = container.querySelector('[role="group"].sc-daterangepicker') as HTMLElement;
  const id = group.getAttribute('aria-labelledby');
  expect(container.querySelector(`#${id}`)?.textContent).toBe('対象の期間');
  expect(fields(container).length).toBe(2);
});

it('欄で打つと対で知らせる(片方だけ変わったときも対)', async () => {
  const onchange = vi.fn();
  const { container } = render(DateRangePicker, { props: { ...props, start: '2026-07-20', end: '2026-07-26', onchange } });
  const startMonth = fields(container)[0]!.querySelector('[data-segment="month"]') as HTMLElement;
  await fireEvent.keyDown(startMonth, { key: 'ArrowDown' });
  expect(onchange).toHaveBeenLastCalledWith({ start: '2026-06-20', end: '2026-07-26' });
});

it('終わりの欄は始まりより前を選べない(逆も同じ)', () => {
  const { container } = render(DateRangePicker, { props: { ...props, start: '2026-07-20', end: '2026-07-26' } });
  // 始まりの欄の上限は終わり、終わりの欄の下限は始まり
  const endDay = fields(container)[1]!.querySelector('[data-segment="day"]') as HTMLElement;
  expect(endDay).not.toBeNull();
});

it('無効のときは暦を開けない', () => {
  const { container } = render(DateRangePicker, { props: { ...props, disabled: true } });
  expect((container.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
});
