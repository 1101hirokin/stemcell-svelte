import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import List from './List.svelte';

const items = [
  { id: 'a', name: '土鍋' },
  { id: 'b', name: 'まな板' },
  { id: 'c', name: 'ざる' },
];
// testing-library の render は総称の推論を通さないので、スニペットは器の側の型で受ける
// (実際の .svelte からは generics で具体型が推論される。Sources のテストと同じ形)
const row = createRawSnippet((item: () => { id: string }) => ({
  render: () => `<span>${(item() as unknown as { name: string }).name}</span>`,
}));

it('並びの構造と項目の器は List が持つ(アプリの作法に頼らない)', () => {
  const { container } = render(List, { props: { items, children: row } });
  const list = container.querySelector('ul') as HTMLElement;
  expect(list.getAttribute('role')).toBe('list');
  expect(container.querySelectorAll('li.sc-list-item').length).toBe(3);
  expect(container.querySelectorAll('li')[1]?.textContent).toBe('まな板');
});

it('項目が無ければ何も描かない(0件のリストを支援技術へ届けない)', () => {
  const { container } = render(List, { props: { items: [] as typeof items, children: row } });
  expect(container.querySelector('ul')).toBeNull();
});

it('区切りは既定で引かない。divided で引く', () => {
  const { container } = render(List, { props: { items, children: row } });
  expect((container.querySelector('ul') as HTMLElement).dataset.divided).toBe('false');
  const { container: c2 } = render(List, { props: { items, children: row, divided: true } });
  expect((c2.querySelector('ul') as HTMLElement).dataset.divided).toBe('true');
});

it('器自身は焦点を受けない(焦点は項目の中の押せる要素に立つ)', () => {
  const { container } = render(List, { props: { items, children: row } });
  expect((container.querySelector('ul') as HTMLElement).hasAttribute('tabindex')).toBe(false);
});
