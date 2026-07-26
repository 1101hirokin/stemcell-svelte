import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import NavList from './NavList.svelte';

const items = [
  { id: 'crm', label: '顧客管理', href: '#/crm' },
  { id: 'shop', label: '通販', href: '#/shop' },
  { id: 'admin', label: '管理', href: '#/admin', disabled: true },
];
const label = createRawSnippet(() => ({ render: () => '<span>画面</span>' }));

it('道案内の領域と、項目の器はこの部品が持つ(アプリの作法に頼らない)', () => {
  const { container } = render(NavList, { props: { items } });
  expect(container.querySelector('nav')).not.toBeNull();
  expect(container.querySelector('ul')?.getAttribute('role')).toBe('list');
  expect(container.querySelectorAll('li').length).toBe(3);
});

it('現在地が支援技術へ届く(色や太さだけで示さない)', () => {
  const { container } = render(NavList, { props: { items, current: 'shop' } });
  const current = container.querySelectorAll('[aria-current="page"]');
  expect(current.length).toBe(1);
  expect(current[0]?.textContent).toContain('通販');
});

it('どこにも居ないときは現在地を持たない(UI が推測しない)', () => {
  const { container } = render(NavList, { props: { items } });
  expect(container.querySelector('[aria-current]')).toBeNull();
});

it('行けない行き先はリンクにせず、Tab 順にも残さない', () => {
  const { container } = render(NavList, { props: { items, current: 'crm' } });
  expect(container.querySelectorAll('a').length).toBe(2);
  const disabled = container.querySelector('[aria-disabled="true"]') as HTMLElement;
  expect(disabled.tagName).toBe('SPAN');
  expect(disabled.textContent).toContain('管理');
});

it('領域名を渡すと道案内の名前になる', () => {
  const { container } = render(NavList, { props: { items, label } });
  const id = container.querySelector('nav')?.getAttribute('aria-labelledby');
  expect(container.querySelector(`#${id}`)?.textContent).toBe('画面');
});
