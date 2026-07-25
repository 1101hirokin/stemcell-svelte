import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import LinearProgress from './LinearProgress.svelte';

// 契約の a11y は生成検査(conformance)が見ない(props と tokensRequired のみ照合。HOLES #19)。
// 値が支援技術へ届くことと、範囲外の扱いは、ここで守る。
describe('LinearProgress', () => {
  it('値と上限が支援技術へ届く(showValue と無関係。契約 a11y)', () => {
    render(LinearProgress, { label: 'アップロード', value: 40 });
    const bar = screen.getByRole('progressbar', { name: 'アップロード' });
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('showValue が false でも値は届く(可視化は伝達の条件でない)', () => {
    render(LinearProgress, { label: '同期', value: 25 });
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('25');
    expect(screen.queryByText('25%')).toBeNull();
  });

  it('showValue で「{n}%」を出す(視覚の正準。全実装同一)', () => {
    render(LinearProgress, { label: '同期', value: 25, showValue: true });
    expect(screen.getByText('25%')).toBeTruthy();
  });

  it('max を超える値は clamp する(ARIA 上 min/max の外は不正。契約)', () => {
    render(LinearProgress, { label: '転送', value: 150 });
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
  });

  it('負の値は 0 へ clamp する', () => {
    render(LinearProgress, { label: '転送', value: -10 });
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });

  it('max を変えると割合がそれに従う', () => {
    render(LinearProgress, { label: '取り込み', value: 3, max: 6, showValue: true });
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuemax')).toBe('6');
    expect(bar.getAttribute('aria-valuenow')).toBe('3');
    expect(screen.getByText('50%')).toBeTruthy();
  });

  it('max が 0 以下なら warn して既定へ退避する(native の不正 max と同じ向き)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(LinearProgress, { label: '転送', value: 50, max: 0 });
    expect(warn).toHaveBeenCalled();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('100');
    warn.mockRestore();
  });
});
