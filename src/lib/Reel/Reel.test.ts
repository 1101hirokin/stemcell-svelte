import { render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, beforeEach, vi } from 'vitest';
import Reel from './Reel.svelte';

const kids = createRawSnippet(() => ({ render: () => '<span>a</span><span>b</span>' }));
const el = (c: HTMLElement) => c.querySelector('.sc-reel') as HTMLElement;
const track = (c: HTMLElement) => c.querySelector('.sc-reel-track') as HTMLElement;

/** jsdom は ResizeObserver もレイアウトも持たないので、購読と寸法を差し替えて測定を駆動する。 */
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  constructor(private cb: () => void) {
    FakeResizeObserver.instances.push(this);
  }
  observe() {}
  disconnect() {}
  fire() {
    this.cb();
  }
}
const size = (node: HTMLElement, { client, box }: { client?: number; box?: number }) => {
  if (client !== undefined) Object.defineProperty(node, 'clientWidth', { value: client, configurable: true });
  if (box !== undefined) node.getBoundingClientRect = () => ({ width: box }) as DOMRect;
};

beforeEach(() => {
  FakeResizeObserver.instances = [];
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
});
afterEach(() => vi.unstubAllGlobals());

it('gap: 段は data-gap で inline の意味層を引き、既定は md', () => {
  const { container } = render(Reel, { props: { children: kids } });
  expect(track(container).dataset.gap).toBe('md');
  const { container: c2 } = render(Reel, { props: { children: kids, gap: 'sm' } });
  expect(track(c2).dataset.gap).toBe('sm');
});

it('gap: 大域の原始 X(8〜24)はインライン style で原始トークンを引く', () => {
  const { container } = render(Reel, { props: { children: kids, gap: '10' } });
  expect(track(container).dataset.gap).toBeUndefined();
  expect(track(container).style.gap).toBe('var(--spacing-10)');
});

it('gap: 語彙外は warn して md へ退避する(layout.md §6)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const bad of ['0', '25', '16px']) {
    const { container } = render(Reel, { props: { children: kids, gap: bad } });
    expect(track(container).dataset.gap, `gap="${bad}"`).toBe('md');
  }
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});

it('あふれていなければ焦点を受けない(中身の無い停留所を作らない)', async () => {
  const { container } = render(Reel, { props: { children: kids } });
  size(el(container), { client: 400 });
  size(track(container), { box: 400 });
  FakeResizeObserver.instances.at(-1)?.fire();
  await tick();
  expect(el(container).hasAttribute('tabindex')).toBe(false);
});

it('あふれたら焦点を受ける(ポインタでしか届かない帯を作らない。第1条)', async () => {
  const { container } = render(Reel, { props: { children: kids } });
  size(el(container), { client: 200 });
  size(track(container), { box: 500 });
  FakeResizeObserver.instances.at(-1)?.fire();
  await tick();
  expect(el(container).getAttribute('tabindex')).toBe('0');
});

it('あふれが解消したら焦点の停留所も消える', async () => {
  const { container } = render(Reel, { props: { children: kids } });
  const ro = FakeResizeObserver.instances.at(-1);
  size(el(container), { client: 200 });
  size(track(container), { box: 500 });
  ro?.fire();
  await tick();
  expect(el(container).getAttribute('tabindex')).toBe('0');
  size(track(container), { box: 180 });
  ro?.fire();
  await tick();
  expect(el(container).hasAttribute('tabindex')).toBe(false);
});
