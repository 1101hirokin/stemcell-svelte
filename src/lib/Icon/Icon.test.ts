/**
 * 実装側テスト。語彙を絵で示す描画器(iconography.md)。意味/装飾の切替、fillRule、
 * mirrorInRTL、未知の name の warn を検証する。色 currentColor・寸法 1em の実測は smoke。
 */
import { render } from '@testing-library/svelte';
import { vi } from 'vitest';
import Icon from './Icon.svelte';

const svg = (c: HTMLElement) => c.querySelector('.sc-icon') as SVGElement;

it('name で描画され、viewBox 32・currentColor・1em を持つ', () => {
  const { container } = render(Icon, { props: { name: 'check' } });
  const el = svg(container);
  expect(el.getAttribute('viewBox')).toBe('0 0 32 32');
  expect(el.getAttribute('fill')).toBe('currentColor');
  expect(el.getAttribute('width')).toBe('1em');
  expect(el.querySelector('path')?.getAttribute('d')).toBeTruthy();
});

it('label 無し: 装飾として支援技術から隠れる(aria-hidden。iconography.md §5)', () => {
  const { container } = render(Icon, { props: { name: 'check' } });
  const el = svg(container);
  expect(el.getAttribute('aria-hidden')).toBe('true');
  expect(el.getAttribute('role')).toBeNull();
});

it('label 有り: 意味を運ぶ(role=img + アクセシブルネーム。iconography.md §5)', () => {
  const { container } = render(Icon, { props: { name: 'search', label: '検索' } });
  const el = svg(container);
  expect(el.getAttribute('role')).toBe('img');
  expect(el.getAttribute('aria-label')).toBe('検索');
  expect(el.getAttribute('aria-hidden')).toBeNull();
});

it('fillRule=evenodd を持つグリフは path に fill-rule を出す(穴あきを保つ)', () => {
  const { container } = render(Icon, { props: { name: 'social.mute' } });
  expect(container.querySelector('path')?.getAttribute('fill-rule')).toBe('evenodd');
});

it('mirrorInRTL のグリフは data-mirror を持ち、そうでないグリフは持たない(iconography.md §4)', () => {
  const { container } = render(Icon, { props: { name: 'arrow.left' } });
  expect(svg(container).getAttribute('data-mirror')).toBe('true');
  const { container: c2 } = render(Icon, { props: { name: 'check' } });
  expect(svg(c2).getAttribute('data-mirror')).toBeNull();
});

it('未知の name は warn して何も描かない(prototype キーも同じ。__proto__/constructor)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const bad of ['no_such_icon', '', '__proto__', 'constructor', 'toString']) {
    const { container } = render(Icon, { props: { name: bad } });
    expect(svg(container), `name="${bad}"`).toBeNull();
    expect(warn.mock.calls.some((c) => String(c[0]).includes(bad || '未知の name "')), `warn for "${bad}"`).toBe(true);
  }
  warn.mockRestore();
});

it('相互作用しない: focus を受けず、states を持たない(契約 a11y。focusRing false)', () => {
  const { container } = render(Icon, { props: { name: 'check' } });
  const el = svg(container);
  expect(el.getAttribute('tabindex')).toBeNull();
});
