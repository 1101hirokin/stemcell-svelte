import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import EmptyState from './EmptyState.svelte';

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const base = { heading: snip('注文がありません') };

it('見出しが何が無いのかを届ける', () => {
  const { container } = render(EmptyState, { props: base });
  const el = container.querySelector('.sc-empty-state') as HTMLElement;
  expect(el.textContent).toContain('注文がありません');
});

it('絵と説明と操作は省ける(見出しだけで立つ)', () => {
  const { container } = render(EmptyState, { props: base });
  expect(container.querySelector('.sc-empty-state-media')).toBeNull();
  expect(container.querySelector('.sc-empty-state-description')).toBeNull();
  expect(container.querySelector('.sc-empty-state-actions')).toBeNull();
});

it('絵は装飾として支援技術から外れる', () => {
  const { container } = render(EmptyState, { props: { ...base, media: snip('絵') } });
  const media = container.querySelector('.sc-empty-state-media') as HTMLElement;
  expect(media.getAttribute('aria-hidden')).toBe('true');
});

it('器は告知しない(生きた領域を持たない)', () => {
  const { container } = render(EmptyState, {
    props: { ...base, description: snip('「土鍋」に一致する注文はありません') },
  });
  const el = container.querySelector('.sc-empty-state') as HTMLElement;
  expect(el.getAttribute('role')).toBeNull();
  expect(el.getAttribute('aria-live')).toBeNull();
  expect(el.querySelector('[aria-live]')).toBeNull();
});
