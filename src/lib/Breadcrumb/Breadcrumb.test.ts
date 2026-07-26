import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Breadcrumb from './Breadcrumb.svelte';

const items = [
  { label: 'ホーム', href: '/' },
  { label: '顧客', href: '/customers' },
  { label: '青葉製作所' },
];
const label = createRawSnippet(() => ({ render: () => '<span>現在地</span>' }));

it('道案内の領域と、順序のある列で描く', () => {
  const { container } = render(Breadcrumb, { props: { items } });
  expect(container.querySelector('nav')).not.toBeNull();
  expect(container.querySelector('ol')).not.toBeNull();
  expect(container.querySelectorAll('li').length).toBe(3);
});

it('最後は現在地で、リンクにしない(今いる場所は行き先ではない)', () => {
  const { container } = render(Breadcrumb, { props: { items } });
  const current = container.querySelector('[aria-current="page"]') as HTMLElement;
  expect(current.textContent).toBe('青葉製作所');
  expect(current.tagName).toBe('SPAN');
  expect(container.querySelectorAll('a').length).toBe(2);
});

it('区切りは装飾として隠す(読み上げにスラッシュが並ばない)', () => {
  const { container } = render(Breadcrumb, { props: { items } });
  const separators = [...container.querySelectorAll('.sc-breadcrumb-separator')];
  expect(separators.length).toBe(2);
  for (const s of separators) expect(s.getAttribute('aria-hidden')).toBe('true');
});

it('領域名を渡すと道案内の名前になる。省略時は名前を持たない', () => {
  const { container } = render(Breadcrumb, { props: { items, label } });
  const id = container.querySelector('nav')?.getAttribute('aria-labelledby');
  expect(container.querySelector(`#${id}`)?.textContent).toBe('現在地');
  const { container: c2 } = render(Breadcrumb, { props: { items } });
  expect(c2.querySelector('nav')?.getAttribute('aria-labelledby')).toBeNull();
});
