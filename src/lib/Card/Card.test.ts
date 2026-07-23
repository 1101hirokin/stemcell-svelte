import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Card from './Card.svelte';

const body = createRawSnippet(() => ({ render: () => '<p>中身</p>' }));

it('既定は影の面(outlined=false)で、内容を載せる器(Card.md §1)', () => {
  const { container } = render(Card, { props: { children: body } });
  const c = container.querySelector('.sc-card') as HTMLElement;
  expect(c.dataset.outlined).toBe('false');
  expect(c.textContent).toContain('中身');
});

it('outlined=true は枠の面(Card.md §2)', () => {
  const { container } = render(Card, { props: { outlined: true, children: body } });
  expect((container.querySelector('.sc-card') as HTMLElement).dataset.outlined).toBe('true');
});

it('意味を持たない器: role を持たず、押せない・フォーカス不可(Card.md §3。Divider/Skeleton と同型)', () => {
  const { container } = render(Card, { props: { children: body } });
  const c = container.querySelector('.sc-card') as HTMLElement;
  expect(c.tagName).toBe('DIV');
  expect(c.getAttribute('role')).toBeNull();
  expect(c.tabIndex).toBeLessThan(0);
});
