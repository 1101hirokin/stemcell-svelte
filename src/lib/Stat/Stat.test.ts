import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Stat from './Stat.svelte';

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const base = { label: snip('今月の売上'), value: snip('1,284,000 円') };

it('名前と値が一つのまとまりとして届く', () => {
  const { container } = render(Stat, { props: base });
  const el = container.querySelector('.sc-stat') as HTMLElement;
  expect(el.textContent).toContain('今月の売上');
  expect(el.textContent).toContain('1,284,000 円');
});

it('変化を出さないときは補足の行ごと出ない', () => {
  const { container } = render(Stat, { props: base });
  expect(container.querySelector('.sc-stat-support')).toBeNull();
});

it('向きは値で、良し悪しは部品が導かない(評価は消費者が渡す)', () => {
  const { container } = render(Stat, {
    props: { ...base, trend: 'up', color: 'danger', support: snip('前月比 +12%') },
  });
  const el = container.querySelector('.sc-stat') as HTMLElement;
  // 上がっているのに danger。解約率のような指標では増加が悪い
  expect(el.dataset.trend).toBe('up');
  expect(el.dataset.color).toBe('danger');
});

it('変化の意味は文字が運ぶ(印だけに頼らない)', async () => {
  const { container } = render(Stat, { props: { ...base, trend: 'down', support: snip('前月比 -3%') } });
  expect(container.querySelector('.sc-stat-support')!.textContent).toContain('前月比 -3%');
  // 印は絵で、名前を持たない(装飾)。name の解決は非同期なので描かれるまで待つ
  await vi.waitFor(() => expect(container.querySelector('.sc-stat-trend svg')).not.toBeNull());
  const mark = container.querySelector('.sc-stat-trend svg') as SVGElement;
  expect(mark.getAttribute('aria-hidden')).toBe('true');
  expect(mark.getAttribute('aria-label')).toBeNull();
});

it('名前と値が名前つきのまとまりとして届く', () => {
  const { container } = render(Stat, { props: base });
  const el = container.querySelector('.sc-stat') as HTMLElement;
  expect(el.getAttribute('role')).toBe('group');
  const named = container.querySelector(`#${el.getAttribute('aria-labelledby')}`);
  expect(named?.textContent).toContain('今月の売上');
});

it('向きだけを渡すと警告する(目で見える人にだけ届く情報になる)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(Stat, { props: { ...base, trend: 'up' } });
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('trend を渡すなら support も要る'));
  warn.mockRestore();
});
