import { render } from '@testing-library/svelte';
import Skeleton from './Skeleton.svelte';

it('既定は text で、支援技術から常に隠れる(Skeleton.md §3。代役は情報ではない)', () => {
  const { container } = render(Skeleton, {});
  const s = container.querySelector('.sc-skeleton') as HTMLElement;
  expect(s.dataset.form).toBe('text');
  expect(s.getAttribute('aria-hidden')).toBe('true');
});

it('form は text/box/circle を取る(Skeleton.md §2)', () => {
  for (const form of ['box', 'circle'] as const) {
    const { container } = render(Skeleton, { props: { form } });
    expect((container.querySelector('.sc-skeleton') as HTMLElement).dataset.form).toBe(form);
  }
});

it('内容を持たない(代役は形だけ。寸法は自前で持たない)', () => {
  const { container } = render(Skeleton, {});
  expect((container.querySelector('.sc-skeleton') as HTMLElement).childElementCount).toBe(0);
});

it('相互作用しない(role を持たず、当たり判定の門の対象外。Skeleton.md §3)', () => {
  const { container } = render(Skeleton, {});
  const s = container.querySelector('.sc-skeleton') as HTMLElement;
  expect(s.getAttribute('role')).toBeNull();
  expect(s.tabIndex).toBeLessThan(0);
});
