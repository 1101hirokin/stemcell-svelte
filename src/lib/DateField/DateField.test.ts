import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import DateField from './DateField.svelte';
import { segmentName, segmentOrder } from '../internal/date';

const label = createRawSnippet(() => ({ render: () => '<span>納品日</span>' }));
const segs = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[role="spinbutton"]')];
const seg = (c: HTMLElement, type: string) => c.querySelector<HTMLElement>(`[data-segment="${type}"]`)!;

it('桁に分かれ、並びと名前は地域から借りる(DS は持たない)', () => {
  const { container } = render(DateField, { props: { label } });
  expect(segs(container).length).toBe(3);
  // 並びは地域が決める。DS は並びを持たないので、環境が答えた並びと一致することを見る
  expect(segs(container).map((s) => s.dataset.segment)).toEqual(segmentOrder());
  expect(seg(container, 'year').getAttribute('aria-label')).toBe(segmentName('year'));
});

it('値を桁へ写し、上下限が支援技術へ届く', () => {
  const { container } = render(DateField, { props: { label, value: '2026-07-20' } });
  expect(seg(container, 'year').textContent).toBe('2026');
  expect(seg(container, 'month').textContent).toBe('07');
  expect(seg(container, 'day').textContent).toBe('20');
  expect(seg(container, 'month').getAttribute('aria-valuenow')).toBe('7');
  expect(seg(container, 'month').getAttribute('aria-valuemin')).toBe('1');
  expect(seg(container, 'month').getAttribute('aria-valuemax')).toBe('12');
  // 7月は31日まで
  expect(seg(container, 'day').getAttribute('aria-valuemax')).toBe('31');
});

it('上下でその桁を増減する(端では回り込む)', async () => {
  const onchange = vi.fn();
  const { container } = render(DateField, { props: { label, value: '2026-07-20', onchange } });
  await fireEvent.keyDown(seg(container, 'month'), { key: 'ArrowUp' });
  expect(onchange).toHaveBeenLastCalledWith('2026-08-20');
  const { container: c2 } = render(DateField, { props: { label, value: '2026-12-20', onchange } });
  await fireEvent.keyDown(seg(c2, 'month'), { key: 'ArrowUp' });
  expect(onchange).toHaveBeenLastCalledWith('2026-01-20');
});

it('左右で桁を移る(論理方向)', async () => {
  const { container } = render(DateField, { props: { label, value: '2026-07-20' } });
  const order = segmentOrder();
  const firstSeg = seg(container, order[0]!);
  const secondSeg = seg(container, order[1]!);
  firstSeg.focus();
  await fireEvent.keyDown(firstSeg, { key: 'ArrowRight' });
  expect(document.activeElement).toBe(secondSeg);
});

it('途中では change を出さない(成立した日だけを知らせる)', async () => {
  const onchange = vi.fn();
  const { container } = render(DateField, { props: { label, onchange } });
  await fireEvent.keyDown(seg(container, 'year'), { key: '2' });
  await fireEvent.keyDown(seg(container, 'year'), { key: '0' });
  await fireEvent.keyDown(seg(container, 'year'), { key: '2' });
  await fireEvent.keyDown(seg(container, 'year'), { key: '6' });
  expect(onchange).not.toHaveBeenCalled(); // 年だけでは日ではない
  await fireEvent.keyDown(seg(container, 'month'), { key: '7' });
  await fireEvent.keyDown(seg(container, 'day'), { key: '2' });
  await fireEvent.keyDown(seg(container, 'day'), { key: '0' });
  expect(onchange).toHaveBeenCalledWith('2026-07-20');
});

it('全桁を消したときは空で知らせる(「消した」は成立した意思)', async () => {
  const onchange = vi.fn();
  const { container } = render(DateField, { props: { label, value: '2026-07-20', onchange } });
  for (const t of ['year', 'month', 'day']) {
    await fireEvent.keyDown(seg(container, t), { key: 'Backspace' });
  }
  expect(onchange).toHaveBeenLastCalledWith('');
});

it('矢印は下限・上限の外へ出ない', async () => {
  const onchange = vi.fn();
  const { container } = render(DateField, { props: { label, value: '2026-07-15', min: '2026-07-15', onchange } });
  await fireEvent.keyDown(seg(container, 'day'), { key: 'ArrowDown' });
  expect(onchange).not.toHaveBeenCalled(); // 14日は下限より前
  await fireEvent.keyDown(seg(container, 'day'), { key: 'ArrowUp' });
  expect(onchange).toHaveBeenLastCalledWith('2026-07-16');
});

it('無効のときは桁が焦点を受けず、操作も効かない', async () => {
  const onchange = vi.fn();
  const { container } = render(DateField, { props: { label, value: '2026-07-20', disabled: true, onchange } });
  expect(seg(container, 'day').tabIndex).toBe(-1);
  await fireEvent.keyDown(seg(container, 'day'), { key: 'ArrowUp' });
  expect(onchange).not.toHaveBeenCalled();
});
