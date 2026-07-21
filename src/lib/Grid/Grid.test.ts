/**
 * 値域ロジックの実装側テスト(layout.md §6「値の照合は実装側の適合テストの仕事」)。
 * 列の増減そのもの(レイアウト)は jsdom では測れないため experiments/grid-min が実測する。
 */
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Grid from './Grid.svelte';

const kids = createRawSnippet(() => ({ render: () => '<span>a</span>' }));
const grid = (c: HTMLElement) => c.querySelector('.sc-grid') as HTMLElement;

it('gap: 段(sm/md/lg)は data-gap で意味層を引き、既定は md', () => {
  const { container } = render(Grid, { props: { children: kids } });
  expect(grid(container).dataset.gap).toBe('md');
  const { container: c2 } = render(Grid, { props: { children: kids, gap: 'lg' } });
  expect(grid(c2).dataset.gap).toBe('lg');
});

it('gap: 大域の原始 X(8〜24)はインライン style で原始トークンを引く', () => {
  const { container } = render(Grid, { props: { children: kids, gap: '12' } });
  const el = grid(container);
  expect(el.dataset.gap).toBeUndefined();
  expect(el.style.gap).toBe('var(--spacing-12)');
});

it('gap: 語彙外は warn して md へ退避する(layout.md §6)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const bad of ['0', '7', '25', '16px', 'banana']) {
    const { container } = render(Grid, { props: { children: kids, gap: bad } });
    expect(grid(container).dataset.gap, `gap="${bad}"`).toBe('md');
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes(`gap="${bad}"`)),
      `warn for gap="${bad}"`,
    ).toBe(true);
  }
  warn.mockRestore();
});

it('min: rem の長さでない文字列は warn して既定 16rem へ退避する(template の無警告消滅を防ぐ。HOLES #20)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const bad of ['banana', '', '16', '240px', '50%', 'calc(100% - 2rem)']) {
    const { container } = render(Grid, { props: { children: kids, min: bad } });
    expect(
      grid(container).style.getPropertyValue('--sc-grid-min'),
      `min="${bad}"`,
    ).toBe('16rem');
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes(`min="${bad}"`)),
      `warn for min="${bad}"`,
    ).toBe(true);
  }
  const { container } = render(Grid, { props: { children: kids, min: '20rem' } });
  expect(grid(container).style.getPropertyValue('--sc-grid-min')).toBe('20rem');
  warn.mockRestore();
});
