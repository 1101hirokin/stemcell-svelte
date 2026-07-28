/**
 * 実装側テスト。語彙を絵で示す部品(iconography.md)。name(中立契約。非同期解決)と
 * glyph(Web 方言。同期・ツリーシェイク)の両方、意味/装飾の a11y、fillRule、mirrorInRTL を検証。
 * 色 currentColor・寸法 1em の実測は smoke。
 */
import { render, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import Icon from './Icon.svelte';
import check from '@stemcell/icons/check';
import socialMute from '@stemcell/icons/social.mute';
import arrowLeft from '@stemcell/icons/arrow.left';

const svg = (c: HTMLElement) => c.querySelector('.sc-icon') as SVGElement;
const findSvg = (c: HTMLElement) => waitFor(() => { if (!svg(c)) throw new Error('not yet'); return svg(c); });

// SSR で glyph が描かれること(独立レビュー B1)は消費アプリの vite SSR ビルドで実測する
// (vitest は .svelte を client 用にコンパイルし svelte/server と混ざると effect_orphan になるため)。
// glyph は $derived(同期)で resolved に流れ SSR で出る。name は $effect の非同期解決なので SSR 直後は出ない。

it('glyph 渡し(Web 方言): 同期で描画され viewBox 32・currentColor・1em を持つ', () => {
  const { container } = render(Icon, { props: { glyph: check } });
  const el = svg(container); // glyph は同期
  expect(el.getAttribute('viewBox')).toBe('0 0 32 32');
  expect(el.getAttribute('fill')).toBe('currentColor');
  expect(el.getAttribute('width')).toBe('1em');
  expect(el.querySelector('path')?.getAttribute('d')).toBe(check.path);
});

it('name 渡し(中立契約): 非同期に解決して描画される', async () => {
  const { container } = render(Icon, { props: { name: 'check' } });
  const el = await findSvg(container);
  expect(el.querySelector('path')?.getAttribute('d')).toBe(check.path);
});

it('label 無し: 装飾として支援技術から隠れる(aria-hidden。iconography.md §5)', () => {
  const { container } = render(Icon, { props: { glyph: check } });
  const el = svg(container);
  expect(el.getAttribute('aria-hidden')).toBe('true');
  expect(el.getAttribute('role')).toBeNull();
});

it('label 有り: 意味を運ぶ(role=img + アクセシブルネーム。iconography.md §5)', () => {
  const { container } = render(Icon, { props: { glyph: check, label: '完了' } });
  const el = svg(container);
  expect(el.getAttribute('role')).toBe('img');
  expect(el.getAttribute('aria-label')).toBe('完了');
  expect(el.getAttribute('aria-hidden')).toBeNull();
});

it('fillRule=evenodd を持つグリフは path に fill-rule を出す(穴あきを保つ)', () => {
  const { container } = render(Icon, { props: { glyph: socialMute } });
  expect(container.querySelector('path')?.getAttribute('fill-rule')).toBe('evenodd');
});

it('mirrorInRTL のグリフは data-mirror を持ち、そうでないグリフは持たない(iconography.md §4)', () => {
  const { container } = render(Icon, { props: { glyph: arrowLeft } });
  expect(svg(container).getAttribute('data-mirror')).toBe('true');
  const { container: c2 } = render(Icon, { props: { glyph: check } });
  expect(svg(c2).getAttribute('data-mirror')).toBeNull();
});

it('未知の name は warn して何も描かない(prototype キーも同じ)', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const bad of ['no_such_icon', '__proto__', 'constructor']) {
    const { container } = render(Icon, { props: { name: bad } });
    await waitFor(() => {
      expect(warn.mock.calls.some((c) => String(c[0]).includes(bad)), `warn for "${bad}"`).toBe(true);
    });
    expect(svg(container), `name="${bad}"`).toBeNull();
  }
  warn.mockRestore();
});
