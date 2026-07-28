/**
 * 実装側テスト。消費者のテーマ(StemcellProvider.md §7)の配線を検証する。
 * 変換そのものは @stemcell/tokens が持ち、そちらで試験済み。ここは「立つ / 外れる / 流さない」だけを見る。
 */
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import StemcellProvider from './StemcellProvider.svelte';

// 消費者のテーマ(HOLES #5 / StemcellProvider.md §7)
describe('themes', () => {
  const style = () => document.head.querySelector('style[data-stemcell-themes]') as HTMLStyleElement | null;

  it('渡された段だけを宣言する(残りは既定のまま)', async () => {
    const { unmount } = render(StemcellProvider, {
      props: { themes: [{ key: 'acme', scheme: 'light', colors: { brand: { '600': '#5e4bde' } } }] },
    });
    await tick();
    const css = style()?.textContent ?? '';
    expect(css).toContain('[data-theme="acme"]');
    expect(css).toContain('--color-brand-600: #5e4bde;');
    expect(css).not.toContain('--color-brand-500');
    unmount();
  });

  it('色として読めない値は CSS へ流さず、開発中に言う', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { unmount } = render(StemcellProvider, {
      props: { themes: [{ key: 'acme', scheme: 'light', colors: { brand: { '600': 'red; } * { display: none' } } }] },
    });
    await tick();
    expect(style()?.textContent ?? '').not.toContain('display: none');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('brand.600'));
    warn.mockRestore();
    unmount();
  });

  it('外れたら CSS も外れる', async () => {
    const { unmount } = render(StemcellProvider, {
      props: { themes: [{ key: 'acme', scheme: 'dark', colors: { brand: { '500': '#123456' } } }] },
    });
    await tick();
    expect(style()).not.toBe(null);
    unmount();
    await tick();
    expect(style()).toBe(null);
  });
});
