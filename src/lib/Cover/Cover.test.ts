import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Cover from './Cover.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const kids = snip('<p>主役</p>');
const el = (c: HTMLElement) => c.querySelector('.sc-cover') as HTMLElement;

it('頭と足は任意で、無ければ描かない', () => {
  const { container } = render(Cover, { props: { children: kids } });
  expect(container.querySelector('.sc-cover-header')).toBeNull();
  expect(container.querySelector('.sc-cover-footer')).toBeNull();
  expect(container.querySelector('.sc-cover-main')?.textContent).toBe('主役');
});

it('頭と足を渡すと主役の前後に置く(DOM の順が読み上げの順)', () => {
  const { container } = render(Cover, {
    props: { children: kids, header: snip('<span>頭</span>'), footer: snip('<span>足</span>') },
  });
  const order = [...el(container).children].map((n) => n.className);
  expect(order).toEqual(['sc-cover-header', 'sc-cover-main', 'sc-cover-footer']);
});

it('頭と足を landmark の要素にしない(器は構造を主張しない。layout.md §6)', () => {
  const { container } = render(Cover, {
    props: { children: kids, header: snip('<span>頭</span>'), footer: snip('<span>足</span>') },
  });
  expect(container.querySelector('header')).toBeNull();
  expect(container.querySelector('footer')).toBeNull();
});

it('gap: 段は data-gap で stack の意味層を引き、既定は md', () => {
  const { container } = render(Cover, { props: { children: kids } });
  expect(el(container).dataset.gap).toBe('md');
  const { container: c2 } = render(Cover, { props: { children: kids, gap: 'lg' } });
  expect(el(c2).dataset.gap).toBe('lg');
});

it('gap: 大域の原始 X(8〜24)はインライン style で原始トークンを引く', () => {
  const { container } = render(Cover, { props: { children: kids, gap: '12' } });
  expect(el(container).dataset.gap).toBeUndefined();
  expect(el(container).style.gap).toBe('var(--spacing-12)');
});

it('gap: 語彙外は warn して md へ退避する(layout.md §6)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const bad of ['0', '7', '25', '16px']) {
    const { container } = render(Cover, { props: { children: kids, gap: bad } });
    expect(el(container).dataset.gap, `gap="${bad}"`).toBe('md');
  }
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});
