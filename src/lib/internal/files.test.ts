import { expect, it } from 'vitest';
import { matchesAccept, splitByAccept } from './files';

const file = (name: string, type: string) => new File(['x'], name, { type });

it('accept が無ければ何でも通す', () => {
  expect(matchesAccept(file('a.txt', 'text/plain'), undefined)).toBe(true);
  expect(matchesAccept(file('a.txt', 'text/plain'), [])).toBe(true);
});

it('MIME 型をそのまま照合する', () => {
  expect(matchesAccept(file('a.png', 'image/png'), ['image/png'])).toBe(true);
  expect(matchesAccept(file('a.jpg', 'image/jpeg'), ['image/png'])).toBe(false);
});

it('総称(image/*)を解く', () => {
  expect(matchesAccept(file('a.jpg', 'image/jpeg'), ['image/*'])).toBe(true);
  expect(matchesAccept(file('a.pdf', 'application/pdf'), ['image/*'])).toBe(false);
  expect(matchesAccept(file('a.pdf', 'application/pdf'), ['*/*'])).toBe(true);
});

it('拡張子(Web の方言)も解く', () => {
  expect(matchesAccept(file('data.csv', ''), ['.csv'])).toBe(true);
  expect(matchesAccept(file('data.tsv', ''), ['.csv'])).toBe(false);
});

it('受け取るものと弾くものへ分ける', () => {
  const files = [file('a.png', 'image/png'), file('b.pdf', 'application/pdf')];
  const { accepted, rejected } = splitByAccept(files, ['image/*']);
  expect(accepted.map((f) => f.name)).toEqual(['a.png']);
  expect(rejected.map((f) => f.name)).toEqual(['b.pdf']);
});
