/**
 * 値域と DOM 順の実装側テスト。折返しそのもの(レイアウト)は jsdom では測れないため
 * smoke(実 Chromium)が実測する。
 */
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Sidebar from './Sidebar.svelte';

const sideSlot = createRawSnippet(() => ({ render: () => '<nav>脇</nav>' }));
const kids = createRawSnippet(() => ({ render: () => '<p>本体</p>' }));
const root = (c: HTMLElement) => c.querySelector('.sc-sidebar') as HTMLElement;

it('side は DOM 順を決める: start = 脇→本体、end = 本体→脇(視覚だけの入替をしない。WCAG 1.3.2)', () => {
  const { container } = render(Sidebar, { props: { sideSlot, children: kids } });
  let order = [...root(container).children].map((el) => el.className);
  expect(order).toEqual(['sc-sidebar-side', 'sc-sidebar-content']);
  const { container: c2 } = render(Sidebar, { props: { sideSlot, children: kids, side: 'end' } });
  order = [...root(c2).children].map((el) => el.className);
  expect(order).toEqual(['sc-sidebar-content', 'sc-sidebar-side']);
});

it('視覚だけの入替(order / row-reverse)を使っていない', () => {
  const { container } = render(Sidebar, { props: { sideSlot, children: kids, side: 'end' } });
  const el = root(container);
  expect(el.style.flexDirection).toBe('');
  for (const child of el.children) expect((child as HTMLElement).style.order).toBe('');
});

it('sideWidth: rem の長さは基底幅になり、省略時は変数ごと無い(内容幅)', () => {
  const { container } = render(Sidebar, { props: { sideSlot, children: kids, sideWidth: '18rem' } });
  expect(root(container).style.getPropertyValue('--sc-sidebar-side-width')).toBe('18rem');
  const { container: c2 } = render(Sidebar, { props: { sideSlot, children: kids } });
  expect(root(c2).style.getPropertyValue('--sc-sidebar-side-width')).toBe('');
});

it('sideWidth: rem の長さでない文字列は warn して内容幅へ退避する(HOLES #21)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const bad of ['banana', '280px', '30%', '18']) {
    const { container } = render(Sidebar, { props: { sideSlot, children: kids, sideWidth: bad } });
    expect(
      root(container).style.getPropertyValue('--sc-sidebar-side-width'),
      `sideWidth="${bad}"`,
    ).toBe('');
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes(`sideWidth="${bad}"`)),
      `warn for sideWidth="${bad}"`,
    ).toBe(true);
  }
  warn.mockRestore();
});

it('contentMin: 既定 50%。百分率でない文字列と 100% 超は warn して 50% へ退避する', () => {
  const { container } = render(Sidebar, { props: { sideSlot, children: kids } });
  expect(root(container).style.getPropertyValue('--sc-sidebar-content-min')).toBe('50%');
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const bad of ['banana', '50', '30rem', '101%', '']) {
    const { container: c2 } = render(Sidebar, {
      props: { sideSlot, children: kids, contentMin: bad },
    });
    expect(
      root(c2).style.getPropertyValue('--sc-sidebar-content-min'),
      `contentMin="${bad}"`,
    ).toBe('50%');
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes(`contentMin="${bad}"`)),
      `warn for contentMin="${bad}"`,
    ).toBe(true);
  }
  const { container: c3 } = render(Sidebar, {
    props: { sideSlot, children: kids, contentMin: '60%' },
  });
  expect(root(c3).style.getPropertyValue('--sc-sidebar-content-min')).toBe('60%');
  warn.mockRestore();
});

it('gap: 段は data-gap、原始 X はインライン style、語彙外は warn して md(layout.md §6)', () => {
  const { container } = render(Sidebar, { props: { sideSlot, children: kids, gap: 'lg' } });
  expect(root(container).dataset.gap).toBe('lg');
  const { container: c2 } = render(Sidebar, { props: { sideSlot, children: kids, gap: '16' } });
  expect(root(c2).style.gap).toBe('var(--spacing-16)');
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { container: c3 } = render(Sidebar, { props: { sideSlot, children: kids, gap: 'huge' } });
  expect(root(c3).dataset.gap).toBe('md');
  expect(warn.mock.calls.some((c) => String(c[0]).includes('gap="huge"'))).toBe(true);
  warn.mockRestore();
});
