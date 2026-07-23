import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Text from './Text.svelte';

const body = createRawSnippet(() => ({ render: () => '<span>本文</span>' }));

it('既定は span(中立のインライン)で variant=body-md。内容を描く(Text.md §2)', () => {
  const { container } = render(Text, { props: { children: body } });
  const t = container.querySelector('.sc-text') as HTMLElement;
  expect(t.tagName).toBe('SPAN');
  expect(t.dataset.variant).toBe('body-md');
  expect(t.textContent).toBe('本文');
});

it('as で意味要素を選ぶ(多相)。variant とは独立(見た目と階層を分離。§2)', () => {
  const { container } = render(Text, { props: { as: 'h2', variant: 'title-lg', children: body } });
  const t = container.querySelector('.sc-text') as HTMLElement;
  expect(t.tagName).toBe('H2'); // 階層は as
  expect(t.dataset.variant).toBe('title-lg'); // 見た目は variant
});

it('variant は見た目だけを data 属性で当てる(意味要素は含意しない)', () => {
  // 同じ variant を段落にも見出しにも当てられる
  const p = render(Text, { props: { as: 'p', variant: 'body-lg', children: body } });
  expect((p.container.querySelector('.sc-text') as HTMLElement).tagName).toBe('P');
  const h = render(Text, { props: { as: 'h3', variant: 'body-lg', children: body } });
  expect((h.container.querySelector('.sc-text') as HTMLElement).tagName).toBe('H3');
});

it('truncate / muted はフラグとして data 属性が立つ(既定は立たない)', () => {
  const off = render(Text, { props: { children: body } });
  const t0 = off.container.querySelector('.sc-text') as HTMLElement;
  expect(t0.hasAttribute('data-truncate')).toBe(false);
  expect(t0.hasAttribute('data-muted')).toBe(false);

  const on = render(Text, { props: { truncate: true, muted: true, children: body } });
  const t1 = on.container.querySelector('.sc-text') as HTMLElement;
  expect(t1.hasAttribute('data-truncate')).toBe(true);
  expect(t1.hasAttribute('data-muted')).toBe(true);
});

it('相互作用しない: role を持たず、フォーカス不可(意味要素の既定の意味論だけが残る)', () => {
  const { container } = render(Text, { props: { children: body } });
  const t = container.querySelector('.sc-text') as HTMLElement;
  expect(t.getAttribute('role')).toBeNull();
  expect(t.tabIndex).toBeLessThan(0);
});

it('truncate は視覚だけの省略: DOM のテキストは全文のまま、aria-hidden も付かない(契約 a11y)', () => {
  const long = createRawSnippet(() => ({ render: () => `<span>${'長い文章'.repeat(50)}</span>` }));
  const { container } = render(Text, { props: { truncate: true, children: long } });
  const t = container.querySelector('.sc-text') as HTMLElement;
  expect(t.textContent).toBe('長い文章'.repeat(50)); // 全文が残る(切るのは見た目だけ)
  expect(t.hasAttribute('aria-hidden')).toBe(false);
});

it('truncate でも相互作用要素にしない(省略に tooltip 用の tabindex を勝手に足さない)', () => {
  const { container } = render(Text, { props: { truncate: true, children: body } });
  const t = container.querySelector('.sc-text') as HTMLElement;
  expect(t.getAttribute('role')).toBeNull();
  expect(t.tabIndex).toBeLessThan(0);
});
