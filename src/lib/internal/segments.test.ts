import { showSegment, stepSegment, takeDigit } from './segments';

it('未入力は下敷きを出し、値は桁の幅で詰める', () => {
  expect(showSegment(undefined, 2, 'MM')).toBe('MM');
  expect(showSegment(3, 2, 'MM')).toBe('03');
  expect(showSegment(2026, 4, 'YYYY')).toBe('2026');
});

it('増減は端で回る', () => {
  const b = { min: 1, max: 12 };
  expect(stepSegment(12, 1, b, 1)).toBe(1);
  expect(stepSegment(1, -1, b, 1)).toBe(12);
  expect(stepSegment(undefined, 1, b, 5)).toBe(6);
});

it('打った数字は右から溜まり、埋まると次へ送る合図が立つ', () => {
  const b = { min: 0, max: 59 };
  expect(takeDigit('', '1', 2, b)).toEqual({ typed: '1', value: 1, advance: false });
  expect(takeDigit('1', '5', 2, b)).toEqual({ typed: '15', value: 15, advance: true });
  // これ以上打てない数(6 の次は 60 で上限超え)は、その場で次へ送る
  expect(takeDigit('', '6', 2, b)).toEqual({ typed: '6', value: 6, advance: true });
});

it('上下限へ収める(0 は下限へ寄せる)', () => {
  expect(takeDigit('', '0', 2, { min: 1, max: 12 }).value).toBe(1);
  expect(takeDigit('9', '9', 2, { min: 1, max: 12 }).value).toBe(12);
});
