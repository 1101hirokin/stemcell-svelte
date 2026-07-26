import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Sources from './Sources.svelte';
import type { SourceItem } from './meta';

const items = [
  { id: 's1', title: '仕様書', url: 'https://example.com/spec' },
  { id: 's2', title: '報告書', url: 'https://example.com/report' },
];
// 項目の中身はアプリが組む(契約は中身の最小形を固定しない)。id 以外は素通しなので、
// テストでは中身の型を SourceItem のまま受けて読み出す(実際の .svelte からは generics で
// 具体型が推論される。testing-library の render は総称の推論を通さない)
const item = createRawSnippet((source: () => SourceItem) => ({
  render: () => `<a href="${String(source().url)}">${String(source().title)}</a>`,
}));
const label = createRawSnippet(() => ({ render: () => '<span>出典</span>' }));

it('リストの器と項目の器は Sources が持つ(アプリの作法に頼らない)', () => {
  const { container } = render(Sources, { props: { items, children: item } });
  const list = container.querySelector('.sc-sources') as HTMLElement;
  expect(list.tagName).toBe('UL');
  expect(list.getAttribute('role')).toBe('list');
  const lis = container.querySelectorAll('li.sc-sources-item');
  expect(lis.length).toBe(2);
  expect(lis[0]?.querySelector('a')?.textContent).toBe('仕様書');
});

it('各項目は source が持つ id を帯びる(UI は採番しない。source §3)', () => {
  const { container } = render(Sources, { props: { items, children: item } });
  expect(container.querySelector('#s1')?.classList.contains('sc-sources-item')).toBe(true);
  expect(container.querySelector('#s2')?.classList.contains('sc-sources-item')).toBe(true);
});

it('id を持たない出典は warn する(発明せずに知らせる)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(Sources, { props: { items: [{ id: '', title: 'a' }] as never, children: item } });
  expect(warn.mock.calls.some((c) => String(c[0]).includes('相互参照キー'))).toBe(true);
  warn.mockRestore();
});

it('id を持たない出典が複数あっても一覧は落ちない(逐次配信の途中の形)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const half = [{ id: 's1', title: 'a', url: 'x' }, { id: '', title: 'b', url: 'y' }, { id: '', title: 'c', url: 'z' }];
  const { container } = render(Sources, { props: { items: half as never, children: item } });
  expect(container.querySelectorAll('li.sc-sources-item').length).toBe(3);
  // id を持つものだけが相互参照の端になる(採番しない)
  expect(container.querySelectorAll('li[id]').length).toBe(1);
  warn.mockRestore();
});

it('領域名を渡すとリストの名前になる。省略時は名前を持たない', () => {
  const { container } = render(Sources, { props: { items, children: item, label } });
  const list = container.querySelector('.sc-sources') as HTMLElement;
  const id = list.getAttribute('aria-labelledby');
  expect(container.querySelector(`#${id}`)?.textContent).toBe('出典');
  const { container: c2 } = render(Sources, { props: { items, children: item } });
  expect(c2.querySelector('.sc-sources')?.getAttribute('aria-labelledby')).toBeNull();
});

it('出典が無ければ何も描かない(項目が0件のリストを支援技術へ届けない)', () => {
  const { container } = render(Sources, { props: { items: [] as typeof items, children: item } });
  expect(container.querySelector('.sc-sources')).toBeNull();
});

it('リスト自身は焦点を受けない(焦点は項目内の Link に立つ。契約 focusRing: false)', () => {
  const { container } = render(Sources, { props: { items, children: item } });
  const list = container.querySelector('.sc-sources') as HTMLElement;
  expect(list.hasAttribute('tabindex')).toBe(false);
});
