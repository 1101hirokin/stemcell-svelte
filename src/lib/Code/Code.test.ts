import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Code from './Code.svelte';

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

it('コードであることを native が届ける(code 要素)', () => {
  const { container } = render(Code, { props: { children: snip('npm install') } });
  const el = container.querySelector('.sc-code') as HTMLElement;
  expect(el.tagName).toBe('CODE');
  expect(el.textContent).toContain('npm install');
});

it('器は焦点を受けない(文中の一語に操作を足さない)', () => {
  const { container } = render(Code, { props: { children: snip('--flag') } });
  const el = container.querySelector('.sc-code') as HTMLElement;
  expect(el.hasAttribute('tabindex')).toBe(false);
});
