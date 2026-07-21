/**
 * 値域ロジックの実装側テスト。layout.md §6「値の照合は実装側の適合テストの仕事」の実体
 * (契約の gap / threshold は混合型の string で、生成される適合テストは enum 照合をスキップする)。
 */
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Switcher from './Switcher.svelte';
import { isRemLength } from './meta';
import { isGlobalPrimitive } from '../internal/spacing';

const kids = createRawSnippet(() => ({ render: () => '<span>a</span>' }));
const sw = (c: HTMLElement) => c.querySelector('.sc-switcher') as HTMLElement;

it('gap: 段(sm/md/lg)は data-gap で意味層を引き、既定は md', () => {
  const { container } = render(Switcher, { props: { children: kids } });
  expect(sw(container).dataset.gap).toBe('md');
  const { container: c2 } = render(Switcher, { props: { children: kids, gap: 'lg' } });
  expect(sw(c2).dataset.gap).toBe('lg');
});

it('gap: 大域の原始 X(8〜24)はインライン style で原始トークンを引く', () => {
  const { container } = render(Switcher, { props: { children: kids, gap: '8' } });
  const el = sw(container);
  expect(el.dataset.gap).toBeUndefined();
  expect(el.style.gap).toBe('var(--spacing-8)');
});

it('gap: 語彙外(小域 0〜7・範囲外・生 px)は warn して md へ退避する(layout.md §6)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const bad of ['0', '7', '25', '08', '16px', 'banana']) {
    const { container } = render(Switcher, { props: { children: kids, gap: bad } });
    expect(sw(container).dataset.gap, `gap="${bad}"`).toBe('md');
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes(`gap="${bad}"`)),
      `warn for gap="${bad}"`,
    ).toBe(true);
  }
  warn.mockRestore();
});

it('isGlobalPrimitive: 境界(7/8/24/25)と非正規形(08)を正しく裁く', () => {
  expect(isGlobalPrimitive('8')).toBe(true);
  expect(isGlobalPrimitive('24')).toBe(true);
  for (const bad of ['7', '25', '08', '8.5', '-8', '']) expect(isGlobalPrimitive(bad), bad).toBe(false);
});

it('threshold: rem の長さでない文字列は warn して既定 30rem へ退避する(単位の裁定 + 閾値機構の無警告消滅を防ぐ)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const bad of ['banana', '', '30', '480px', 'calc(100% - 2rem)']) {
    const { container } = render(Switcher, { props: { children: kids, threshold: bad } });
    expect(
      sw(container).style.getPropertyValue('--sc-switcher-threshold'),
      `threshold="${bad}"`,
    ).toBe('30rem');
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes(`threshold="${bad}"`)),
      `warn for threshold="${bad}"`,
    ).toBe(true);
  }
  const { container } = render(Switcher, { props: { children: kids, threshold: '40rem' } });
  expect(sw(container).style.getPropertyValue('--sc-switcher-threshold')).toBe('40rem');
  warn.mockRestore();
});

it('isRemLength: rem の長さだけを許す(単位は rem と裁定済み。数値集合は未決のため裁かない)', () => {
  for (const ok of ['30rem', '0.5rem', '40rem', ' 30rem ']) expect(isRemLength(ok), ok).toBe(true);
  for (const bad of ['480px', '40em', '66ch', '30', 'rem', 'banana', '', '30 rem', '30%'])
    expect(isRemLength(bad), bad).toBe(false);
});
