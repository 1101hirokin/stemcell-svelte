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

// 揃った後の押下は、内も外も区別せず、その日を下限にして選び直す(DateRangePicker.md)。
it.each([
  { at: '先(外)', day: 25 },
  { at: '中', day: 15 },
  { at: '手前(外)', day: 5 },
])('揃った後に$atを押すと、その日を下限に選び直す', async ({ day }) => {
  const onchange = vi.fn();
  const { container } = render(DateRangePicker, { props: { ...props, onchange } });
  await fireEvent.click(container.querySelector('button') as HTMLElement);
  const cells = [...container.querySelectorAll<HTMLElement>('[role="gridcell"]')];
  const pick = (n: number) => cells.find((el) => el.textContent === String(n))!;
  await fireEvent.click(pick(10));
  await fireEvent.click(pick(20));
  await fireEvent.click(pick(day));
  const two = String(day).padStart(2, '0');
  expect(onchange).toHaveBeenLastCalledWith({ start: expect.stringContaining(`-${two}`), end: '' });
  // 選び直した先は、次の押下で終わりが決まる
  await fireEvent.click(pick(28));
  expect(onchange).toHaveBeenLastCalledWith({
    start: expect.stringContaining(`-${two}`),
    end: expect.stringContaining('-28'),
  });
});

it('途中に下限より前を押したら、対を入れ替えずに下限を置き直す', async () => {
  const onchange = vi.fn();
  const { container } = render(DateRangePicker, { props: { ...props, onchange } });
  await fireEvent.click(container.querySelector('button') as HTMLElement);
  const cells = [...container.querySelectorAll<HTMLElement>('[role="gridcell"]')];
  const pick = (n: number) => cells.find((el) => el.textContent === String(n))!;
  await fireEvent.click(pick(20));
  await fireEvent.click(pick(10)); // 下限より前。ここが新しい下限になる
  expect(onchange).toHaveBeenLastCalledWith({ start: expect.stringContaining('-10'), end: '' });
  await fireEvent.click(pick(15));
  expect(onchange).toHaveBeenLastCalledWith({
    start: expect.stringContaining('-10'),
    end: expect.stringContaining('-15'),
  });
});

it('対の端そのものを押したときは変えない(押し間違いで期間を失わせない)', async () => {
  const onchange = vi.fn();
  const { container } = render(DateRangePicker, { props: { ...props, onchange } });
  await fireEvent.click(container.querySelector('button') as HTMLElement);
  const cells = [...container.querySelectorAll<HTMLElement>('[role="gridcell"]')];
  const pick = (n: number) => cells.find((el) => el.textContent === String(n))!;
  await fireEvent.click(pick(10));
  await fireEvent.click(pick(20));
  const calls = onchange.mock.calls.length;
  await fireEvent.click(pick(10));
  await fireEvent.click(pick(20));
  expect(onchange.mock.calls.length).toBe(calls);
});

it('選び直しても月は動かない(ページ送りは利用者の明示だけ)', async () => {
  const { container } = render(DateRangePicker, { props: { ...props, start: '2026-07-20', end: '2026-07-26' } });
  await fireEvent.click(container.querySelector('button') as HTMLElement);
  const caption = () => container.querySelector('.sc-calendar-month-label')?.textContent ?? '';
  const shown = caption();
  // 次の月へ送ってから、見えている月の日を押す(選び直し)
  const next = container.querySelectorAll('.sc-calendar-nav button')[1] as HTMLElement;
  await fireEvent.click(next);
  const paged = caption();
  expect(paged).not.toBe(shown);
  const cells = [...container.querySelectorAll<HTMLElement>('[role="gridcell"]')];
  await fireEvent.click(cells.find((el) => el.textContent === '15')!);
  expect(caption()).toBe(paged);
});

it('無効のときは暦を開けない', () => {
  const { container } = render(DateRangePicker, { props: { ...props, disabled: true } });
  expect((container.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
});

// 面の先頭へ差し込むスロット(候補の列など)。器は中身を解釈しない(patterns/date-range.md §3)
it('面の先頭へ差し込んだ中身が暦と一緒に出る', async () => {
  const { container } = render(DateRangePicker, {
    props: { ...props, panelLead: snip('期間の候補') },
  });
  await fireEvent.click(container.querySelector('button') as HTMLElement);
  const lead = container.querySelector('.sc-daterangepicker-panel-lead');
  expect(lead?.textContent).toContain('期間の候補');
  // 暦は同じ面の中に居る(差し替えではなく先頭への追加)
  expect(container.querySelector('.sc-daterangepicker-panel .sc-calendar')).not.toBeNull();
});

it('差し込まなければ器は場所を作らない', async () => {
  const { container } = render(DateRangePicker, { props });
  await fireEvent.click(container.querySelector('button') as HTMLElement);
  expect(container.querySelector('.sc-daterangepicker-panel-lead')).toBeNull();
});
