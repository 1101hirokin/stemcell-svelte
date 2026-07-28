import { enabledIndexes, initialActive, nextActive } from './listbox';

const opts = [{}, { disabled: true }, {}, {}];

it('選べないものは飛ばす', () => {
  expect(enabledIndexes(opts)).toEqual([0, 2, 3]);
});

it('端では止まる(回らない)', () => {
  const enabled = enabledIndexes(opts);
  expect(nextActive(enabled, 0, 1)).toBe(2);
  expect(nextActive(enabled, 3, 1)).toBe(3);
  expect(nextActive(enabled, 0, -1)).toBe(0);
});

it('どこにも居ないときは進む向きの端から始める', () => {
  const enabled = enabledIndexes(opts);
  expect(nextActive(enabled, -1, 1)).toBe(0);
  expect(nextActive(enabled, -1, -1)).toBe(3);
});

it('開いたときは選ばれているものから始め、無ければ先頭', () => {
  expect(initialActive(opts, 2)).toBe(2);
  expect(initialActive(opts, -1)).toBe(0);
  // 選ばれているものが選べないときは先頭へ
  expect(initialActive(opts, 1)).toBe(0);
});
