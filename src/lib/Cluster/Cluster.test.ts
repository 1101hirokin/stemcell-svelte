/** 値域ロジックの実装側テスト(layout.md §6)。 */
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Cluster from './Cluster.svelte';

const kids = createRawSnippet(() => ({ render: () => '<span>a</span>' }));
const cluster = (c: HTMLElement) => c.querySelector('.sc-cluster') as HTMLElement;

it('既定: gap=md / align=start', () => {
  const { container } = render(Cluster, { props: { children: kids } });
  const el = cluster(container);
  expect(el.dataset.gap).toBe('md');
  expect(el.dataset.align).toBe('start');
});

it('gap: 段は data-gap、大域の原始 X はインライン style、語彙外は warn して md へ退避', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { container: c1 } = render(Cluster, { props: { children: kids, gap: 'lg' } });
  expect(cluster(c1).dataset.gap).toBe('lg');
  const { container: c2 } = render(Cluster, { props: { children: kids, gap: '8' } });
  expect(cluster(c2).dataset.gap).toBeUndefined();
  expect(cluster(c2).style.gap).toBe('var(--spacing-8)');
  const { container: c3 } = render(Cluster, { props: { children: kids, gap: 'banana' } });
  expect(cluster(c3).dataset.gap).toBe('md');
  expect(warn.mock.calls.some((c) => String(c[0]).includes('gap="banana"'))).toBe(true);
  warn.mockRestore();
});
