/** 値域ロジックの実装側テスト(layout.md §6)。段は direction に応じて stack / inline の意味層を引く。 */
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Stack from './Stack.svelte';

const kids = createRawSnippet(() => ({ render: () => '<span>a</span><span>b</span>' }));
const stack = (c: HTMLElement) => c.querySelector('.sc-stack') as HTMLElement;

it('既定: direction=stack / gap=md / align=stretch', () => {
  const { container } = render(Stack, { props: { children: kids } });
  const el = stack(container);
  expect(el.dataset.direction).toBe('stack');
  expect(el.dataset.gap).toBe('md');
  expect(el.dataset.align).toBe('stretch');
});

it('gap: 段は data-gap に出て、意味層の選択(stack/inline)は CSS が direction で分岐する', () => {
  const { container } = render(Stack, { props: { children: kids, direction: 'inline', gap: 'sm' } });
  const el = stack(container);
  expect(el.dataset.direction).toBe('inline');
  expect(el.dataset.gap).toBe('sm');
});

it('gap: 大域の原始 X はインライン style で原始トークンを引く', () => {
  const { container } = render(Stack, { props: { children: kids, gap: '24' } });
  const el = stack(container);
  expect(el.dataset.gap).toBeUndefined();
  expect(el.style.gap).toBe('var(--spacing-24)');
});

it('gap: 語彙外は warn して既定 md へ退避する', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const bad of ['7', '25', '8px', 'banana']) {
    const { container } = render(Stack, { props: { children: kids, gap: bad } });
    expect(stack(container).dataset.gap, `gap="${bad}"`).toBe('md');
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes(`gap="${bad}"`)),
      `warn for gap="${bad}"`,
    ).toBe(true);
  }
  warn.mockRestore();
});
