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

it('対が揃っても暦は閉じない(両端を見比べながら詰められる)', async () => {
  const onchange = vi.fn();
  const { container } = render(DateRangePicker, { props: { ...props, onchange } });
  const trigger = container.querySelector('button') as HTMLElement;
  await fireEvent.click(trigger);
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
  const cells = [...container.querySelectorAll<HTMLElement>('[role="gridcell"]')];
  const pick = (n: number) => cells.find((el) => el.textContent === String(n))!;
  await fireEvent.click(pick(10));
  expect(onchange).toHaveBeenLastCalledWith({ start: expect.stringContaining('-10'), end: '' });
  await fireEvent.click(pick(20));
  expect(onchange).toHaveBeenLastCalledWith({
    start: expect.stringContaining('-10'),
    end: expect.stringContaining('-20'),
  });
  // 揃っても開いたまま
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
});

// 揃った後の押下は、伸ばすのも縮めるのも同じ規則で受ける(直近に動かした端。反転する押下では反対の端)。
// 10 → 20 と押した直後に動くのは終わりである(DateRangePicker.md)。
it.each([
  { at: '先(伸ばす)', days: [25], want: ['-10', '-25'] },
  { at: '中(縮める)', days: [15], want: ['-10', '-15'] },
  { at: '手前(始まりが動く)', days: [5], want: ['-05', '-20'] },
  { at: '中を続けて2回', days: [15, 12], want: ['-10', '-12'] },
  { at: '手前のあと中(始まりが動いたまま)', days: [5, 15], want: ['-15', '-20'] },
])('揃った後に$atを押す', async ({ days, want }) => {
  const onchange = vi.fn();
  const { container } = render(DateRangePicker, { props: { ...props, onchange } });
  await fireEvent.click(container.querySelector('button') as HTMLElement);
  const cells = [...container.querySelectorAll<HTMLElement>('[role="gridcell"]')];
  const pick = (n: number) => cells.find((el) => el.textContent === String(n))!;
  await fireEvent.click(pick(10));
  await fireEvent.click(pick(20));
  for (const d of days) await fireEvent.click(pick(d));
  expect(onchange).toHaveBeenLastCalledWith({
    start: expect.stringContaining(want[0]!),
    end: expect.stringContaining(want[1]!),
  });
});

it('無効のときは暦を開けない', () => {
  const { container } = render(DateRangePicker, { props: { ...props, disabled: true } });
  expect((container.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
});
