/** 値域ロジックの実装側テスト(layout.md §6)と、逃げ道(as 多相)の土地の声の検証。 */
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Box from './Box.svelte';

const kids = createRawSnippet(() => ({ render: () => '<span>中身</span>' }));
const box = (c: HTMLElement) => c.querySelector('.sc-box') as HTMLElement;

it('inset: 省略時は余白なし(data-inset もインライン padding も出ない)', () => {
  const { container } = render(Box, { props: { children: kids } });
  expect(box(container).dataset.inset).toBeUndefined();
  expect(box(container).style.padding).toBe('');
});

it('inset: 段(sm/md/lg)は data-inset で意味層を引く', () => {
  const { container } = render(Box, { props: { children: kids, inset: 'lg' } });
  expect(box(container).dataset.inset).toBe('lg');
});

it('inset: 大域の原始 X(8〜24)はインライン style で原始トークンを引く', () => {
  const { container } = render(Box, { props: { children: kids, inset: '12' } });
  expect(box(container).dataset.inset).toBeUndefined();
  expect(box(container).style.padding).toBe('var(--spacing-12)');
});

it('inset: 語彙外は warn して余白なしへ退避する(既定が無いため md ではない)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const bad of ['0', '25', '16px', 'banana']) {
    const { container } = render(Box, { props: { children: kids, inset: bad } });
    expect(box(container).dataset.inset, `inset="${bad}"`).toBeUndefined();
    expect(box(container).style.padding, `inset="${bad}"`).toBe('');
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes(`inset="${bad}"`)),
      `warn for inset="${bad}"`,
    ).toBe(true);
  }
  warn.mockRestore();
});

it('inset: 2値「縦 横」で padding-block / padding-inline を別に引く(段と原始の混在も可)', () => {
  const a = render(Box, { props: { children: kids, inset: 'md sm' } });
  expect(box(a.container).dataset.inset).toBeUndefined(); // 2値は data-inset でなくインライン
  expect(box(a.container).style.paddingBlock).toBe('var(--spacing-inset-md)');
  expect(box(a.container).style.paddingInline).toBe('var(--spacing-inset-sm)');
  // 段(縦)× 原始(横)の混在
  const b = render(Box, { props: { children: kids, inset: 'lg 12' } });
  expect(box(b.container).style.paddingBlock).toBe('var(--spacing-inset-lg)');
  expect(box(b.container).style.paddingInline).toBe('var(--spacing-12)');
});

it('inset: 2値で片方が語彙外なら warn して余白なしへ(部分適用しない)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { container } = render(Box, { props: { children: kids, inset: 'md banana' } });
  expect(box(container).style.paddingBlock).toBe('');
  expect(box(container).style.paddingInline).toBe('');
  expect(warn.mock.calls.some((c) => String(c[0]).includes('inset="md banana"'))).toBe(true);
  warn.mockRestore();
});

it('as: 意味的要素へ多相する(逃げ道は Box だけ。layout.md §6)', () => {
  const { container } = render(Box, { props: { children: kids, as: 'section' } });
  const el = box(container);
  expect(el.tagName).toBe('SECTION');
});

it('as: 許可リスト外(script 等の危険要素・不正な文字列)は warn して div へ退避する', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const bad of ['script', 'style', 'iframe', 'banana']) {
    const { container } = render(Box, { props: { children: kids, as: bad as never } });
    expect(box(container).tagName, `as="${bad}"`).toBe('DIV');
    expect(container.querySelector(bad), `no <${bad}> in DOM`).toBeNull();
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes(`as="${bad}"`)),
      `warn for as="${bad}"`,
    ).toBe(true);
  }
  warn.mockRestore();
});

it('style / class: 自由な style の受け取り先(Svelte の土地の声)が通る', () => {
  const { container } = render(Box, {
    props: { children: kids, style: 'max-width: 20rem', class: 'consumer' },
  });
  const el = box(container);
  expect(el.classList.contains('consumer')).toBe(true);
  expect(el.style.maxWidth).toBe('20rem');
});
