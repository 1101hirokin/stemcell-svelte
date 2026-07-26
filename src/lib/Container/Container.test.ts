import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Container from './Container.svelte';

const kids = createRawSnippet(() => ({ render: () => '<p>ページ</p>' }));
const el = (c: HTMLElement) => c.querySelector('.sc-container') as HTMLElement;

it('既定は xl(ページの殻の幅)', () => {
  const { container } = render(Container, { props: { children: kids } });
  expect(el(container).dataset.max).toBe('xl');
});

it('段は data-max で container のトークンを引く。測度(prose)は持たない', () => {
  for (const max of ['sm', 'md', 'lg', 'xl'] as const) {
    const { container } = render(Container, { props: { children: kids, max } });
    expect(el(container).dataset.max).toBe(max);
  }
});
