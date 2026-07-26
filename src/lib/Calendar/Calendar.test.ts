import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { vi } from 'vitest';
import Calendar from './Calendar.svelte';
import { formatISO, today } from '../internal/date';

const cells = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[role="gridcell"]')];
const cell = (c: HTMLElement, day: number) => cells(c).find((el) => el.textContent === String(day))!;

it('格子は grid で、列に曜日の見出しが付く', () => {
  const { container } = render(Calendar, { props: { month: '2026-07' } });
  const grid = container.querySelector('[role="grid"]') as HTMLElement;
  expect(grid).not.toBeNull();
  expect(grid.getAttribute('aria-label')).toBeTruthy(); // 月名は環境の書式
  expect(container.querySelectorAll('th[scope="col"]').length).toBe(7);
  expect(cells(container).length).toBe(31); // 2026年7月は31日
});

it('選ばれている日が届く。期間のときは間の日も届く', () => {
  const { container } = render(Calendar, { props: { month: '2026-07', start: '2026-07-20', end: '2026-07-23' } });
  expect(cell(container, 20).dataset.selected).toBe('true');
  expect(cell(container, 23).dataset.selected).toBe('true');
  expect(cell(container, 21).dataset.inRange).toBe('true');
  expect(cell(container, 21).getAttribute('aria-selected')).toBe('true');
  expect(cell(container, 25).getAttribute('aria-selected')).toBe('false');
});

it('今日が届く(state.md §6 の current の date)', () => {
  const t = today();
  const { container } = render(Calendar, { props: { month: `${t.year}-${String(t.month).padStart(2, '0')}` } });
  const el = cell(container, t.day);
  expect(el.getAttribute('aria-current')).toBe('date');
});

it('押された日を返すだけ(意味づけは束ねる側)', async () => {
  const onselect = vi.fn();
  const { container } = render(Calendar, { props: { month: '2026-07', onselect } });
  await fireEvent.click(cell(container, 15));
  expect(onselect).toHaveBeenCalledWith('2026-07-15');
});

it('選べない日は選べず、支援技術にもそう届く。焦点からは外さない', async () => {
  const onselect = vi.fn();
  const { container } = render(Calendar, {
    props: { month: '2026-07', min: '2026-07-10', max: '2026-07-20', unavailable: ['2026-07-15'], onselect },
  });
  expect(cell(container, 5).getAttribute('aria-disabled')).toBe('true');
  expect(cell(container, 25).getAttribute('aria-disabled')).toBe('true');
  expect(cell(container, 15).getAttribute('aria-disabled')).toBe('true');
  expect(cell(container, 12).getAttribute('aria-disabled')).toBeNull();
  await fireEvent.click(cell(container, 15));
  expect(onselect).not.toHaveBeenCalled();
  // 焦点からは外さない(そこに日があること自体が読める情報)
  expect(cell(container, 15).hasAttribute('tabindex')).toBe(true);
});

it('焦点は格子の中に1つだけ載る(roving tabindex)', () => {
  const { container } = render(Calendar, { props: { month: '2026-07', start: '2026-07-20' } });
  expect(cells(container).filter((el) => el.tabIndex === 0).length).toBe(1);
  expect(cell(container, 20).tabIndex).toBe(0);
});

it('矢印で日と週を移り、月をまたぐと表示も送る', async () => {
  const onmonthchange = vi.fn();
  const { container } = render(Calendar, { props: { month: '2026-07', start: '2026-07-31', onmonthchange } });
  await fireEvent.keyDown(cell(container, 31), { key: 'ArrowRight' });
  await tick();
  expect(onmonthchange).toHaveBeenCalledWith('2026-08');
});

it('Enter で選ぶ(移動は選択ではない)', async () => {
  const onselect = vi.fn();
  const { container } = render(Calendar, { props: { month: '2026-07', start: '2026-07-10', onselect } });
  await fireEvent.keyDown(cell(container, 10), { key: 'ArrowRight' });
  expect(onselect).not.toHaveBeenCalled(); // 移動しただけ
  await tick();
  await fireEvent.keyDown(cell(container, 11), { key: 'Enter' });
  expect(onselect).toHaveBeenCalledWith('2026-07-11');
});

it('月数を渡すと並べて見せる(期間の選択では2つが常態)', () => {
  const { container } = render(Calendar, { props: { month: '2026-07', months: 2 } });
  expect(container.querySelectorAll('[role="grid"]').length).toBe(2);
  expect(cells(container).length).toBe(31 + 31); // 7月と8月
});
