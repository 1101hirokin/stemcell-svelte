import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import CircularProgress from './CircularProgress.svelte';

// 値の規則は LinearProgress と同一(契約が「規則は CircularProgress と同一」と書く関係)。
// 生成検査は a11y を見ない(HOLES #19)ので、伝達と clamp はここで守る。
describe('CircularProgress', () => {
  it('値と上限が支援技術へ届く(showValue と無関係。契約 a11y)', () => {
    render(CircularProgress, { label: '書き出し', value: 40 });
    const bar = screen.getByRole('progressbar', { name: '書き出し' });
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('showValue で「{n}%」を出す。既定では出さない', () => {
    const { unmount } = render(CircularProgress, { label: '書き出し', value: 25 });
    expect(screen.queryByText('25%')).toBeNull();
    unmount();
    render(CircularProgress, { label: '書き出し', value: 25, showValue: true });
    expect(screen.getByText('25%')).toBeTruthy();
  });

  it('範囲外は clamp する(契約)', () => {
    const { unmount } = render(CircularProgress, { label: 'A', value: 150 });
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
    unmount();
    render(CircularProgress, { label: 'B', value: -5 });
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });

  it('max が 0 以下なら warn して既定へ退避する', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(CircularProgress, { label: '書き出し', value: 50, max: -1 });
    expect(warn).toHaveBeenCalled();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('100');
    warn.mockRestore();
  });

  it('size は既定 md で、data-size に写る(loader チャンネル)', () => {
    const { container, unmount } = render(CircularProgress, { label: 'A', value: 10 });
    expect(container.querySelector('.sc-circularprogress')?.getAttribute('data-size')).toBe('md');
    unmount();
    const { container: c2 } = render(CircularProgress, { label: 'A', value: 10, size: 'lg' });
    expect(c2.querySelector('.sc-circularprogress')?.getAttribute('data-size')).toBe('lg');
  });

  it('弧の長さが割合に従う(半分なら円周の半分)', () => {
    const { container } = render(CircularProgress, { label: 'A', value: 50 });
    const arc = container.querySelector('.sc-circularprogress-indicator');
    const circumference = 2 * Math.PI * 16;
    const [dash] = (arc?.getAttribute('stroke-dasharray') ?? '').split(' ').map(Number);
    expect(dash).toBeCloseTo(circumference / 2, 5);
  });

  it('図形は支援技術から隠れる(意味は role と値が運ぶ)', () => {
    const { container } = render(CircularProgress, { label: 'A', value: 10 });
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
