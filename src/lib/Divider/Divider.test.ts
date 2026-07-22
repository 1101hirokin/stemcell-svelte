import { render } from '@testing-library/svelte';
import Divider from './Divider.svelte';

it('既定は stack(積みの流れを切る)で、装飾として支援技術から隠れる(Divider.md §3)', () => {
  const { container } = render(Divider, {});
  const d = container.querySelector('.sc-divider') as HTMLElement;
  expect(d.dataset.orientation).toBe('stack');
  expect(d.getAttribute('aria-hidden')).toBe('true');
});

it('orientation=inline は並びの流れを切る(論理方向。Divider.md §2)', () => {
  const { container } = render(Divider, { props: { orientation: 'inline' } });
  expect((container.querySelector('.sc-divider') as HTMLElement).dataset.orientation).toBe('inline');
});

it('内容を持たない(区切る線のみ。余白も持たない)', () => {
  const { container } = render(Divider, {});
  expect((container.querySelector('.sc-divider') as HTMLElement).childElementCount).toBe(0);
});

it('相互作用せず、意味も持たない(role を持たず、フォーカス不可。Divider.md §3。Skeleton と同型)', () => {
  const { container } = render(Divider, {});
  const d = container.querySelector('.sc-divider') as HTMLElement;
  expect(d.getAttribute('role')).toBeNull();
  expect(d.tabIndex).toBeLessThan(0);
});
