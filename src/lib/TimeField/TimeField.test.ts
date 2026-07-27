import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import TimeField from './TimeField.svelte';

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const base = {
  label: snip('開始時刻'),
  segmentLabels: { hour: '時', minute: '分', second: '秒', dayPeriod: '午前・午後' },
};
const seg = (c: HTMLElement, type: string) =>
  c.querySelector(`[data-segment="${type}"]`) as HTMLInputElement;
/** 桁へ1文字打つ(環境は data に打鍵を載せる。DateField のテストと同じ形) */
const type_ = (el: HTMLInputElement, ch: string) => fireEvent.input(el, { data: ch, inputType: 'insertText' });

it('時と分の桁を持ち、値は 24 時間の表記で来る', async () => {
  const onchange = vi.fn();
  const { container } = render(TimeField, { props: { ...base, hourCycle: '24', onchange } });
  expect(seg(container, 'hour').value).toBe('hh');
  await type_(seg(container, 'hour'), '1');
  // 時だけでは時刻にならない(分が空)
  expect(onchange).not.toHaveBeenCalled();
  await type_(seg(container, 'minute'), '3');
  // 1 時 3 分。桁が揃った時点で成立するので、ここで一度知らせる
  expect(onchange).toHaveBeenLastCalledWith('01:03');
  await type_(seg(container, 'minute'), '0');
  expect(onchange).toHaveBeenLastCalledWith('01:30');
});

it('12 時間制でも値は 24 時間の表記のまま', async () => {
  const onchange = vi.fn();
  const { container } = render(TimeField, { props: { ...base, hourCycle: '12', value: '15:00', onchange } });
  // 表示は 3、値は 15:00
  expect(seg(container, 'hour').value).toBe('03');
  const group = container.querySelector('[role="radiogroup"]') as HTMLElement;
  expect(group).not.toBeNull();
  const [am] = [...group.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];
  await fireEvent.change(am!, { target: { checked: true } });
  expect(onchange).toHaveBeenLastCalledWith('03:00');
});

it('24 時間制では午前・午後を出さない', () => {
  const { container } = render(TimeField, { props: { ...base, hourCycle: '24' } });
  expect(container.querySelector('[role="radiogroup"]')).toBeNull();
});

it('秒は消費者が選ぶ(既定は出さない)', () => {
  const plain = render(TimeField, { props: { ...base, hourCycle: '24' } });
  expect(seg(plain.container, 'second')).toBeNull();
  const withSeconds = render(TimeField, { props: { ...base, hourCycle: '24', seconds: true, value: '10:20:30' } });
  expect(seg(withSeconds.container, 'second').value).toBe('30');
});

it('上下で増減し、端で回る', async () => {
  const onchange = vi.fn();
  const { container } = render(TimeField, { props: { ...base, hourCycle: '24', value: '23:59', onchange } });
  await fireEvent.keyDown(seg(container, 'hour'), { key: 'ArrowUp' });
  expect(onchange).toHaveBeenLastCalledWith('00:59');
});

it('下限と上限の外へは増減で出ない', async () => {
  const onchange = vi.fn();
  const { container } = render(TimeField, {
    props: { ...base, hourCycle: '24', value: '09:00', min: '09:00', max: '18:00', onchange },
  });
  await fireEvent.keyDown(seg(container, 'hour'), { key: 'ArrowDown' });
  expect(onchange).not.toHaveBeenCalled();
});

it('桁の値と範囲が支援技術へ届く', () => {
  const { container } = render(TimeField, { props: { ...base, hourCycle: '24', value: '10:20' } });
  const hour = seg(container, 'hour');
  expect(hour.getAttribute('role')).toBe('spinbutton');
  expect(hour.getAttribute('aria-valuenow')).toBe('10');
  expect(hour.getAttribute('aria-valuemin')).toBe('0');
  expect(hour.getAttribute('aria-valuemax')).toBe('23');
  expect(hour.getAttribute('aria-label')).toBe('時');
});

it('全桁を消したら空で知らせる(「消した」は成立した意思)', async () => {
  const onchange = vi.fn();
  const { container } = render(TimeField, { props: { ...base, hourCycle: '24', value: '10:20', onchange } });
  await fireEvent.keyDown(seg(container, 'hour'), { key: 'Delete' });
  await fireEvent.keyDown(seg(container, 'minute'), { key: 'Delete' });
  expect(onchange).toHaveBeenLastCalledWith('');
});

it('name を渡すとフォーム送信に値が載る', () => {
  const { container } = render(TimeField, { props: { ...base, name: 'start', value: '09:30' } });
  const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
  expect(hidden.name).toBe('start');
  expect(hidden.value).toBe('09:30');
});

it('打ちかけの数字は桁をまたがない', async () => {
  const onchange = vi.fn();
  const { container } = render(TimeField, { props: { ...base, hourCycle: '24', onchange } });
  await type_(seg(container, 'hour'), '1');
  // 隣の桁で 3 を打つ。前の桁の 1 と繋がって 13 にならない
  await type_(seg(container, 'minute'), '3');
  expect(seg(container, 'minute').value).toBe('03');
  expect(onchange).toHaveBeenLastCalledWith('01:03');
});

it('午前・午後は二択として選ぶ(桁にしない)', async () => {
  const onchange = vi.fn();
  const { container } = render(TimeField, { props: { ...base, hourCycle: '12', value: '18:30', onchange } });
  // 桁ではないので spinbutton の並びには居ない
  expect(seg(container, 'dayPeriod')).toBeNull();
  const group = container.querySelector('[role="radiogroup"]') as HTMLElement;
  expect(group.getAttribute('aria-label')).toBe('午前・午後');
  const [am, pm] = [...group.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];
  // 両方が見えていて、いま選ばれている側が分かる
  expect(am!.checked).toBe(false);
  expect(pm!.checked).toBe(true);
  await fireEvent.change(am!, { target: { checked: true } });
  expect(onchange).toHaveBeenLastCalledWith('06:30');
});
