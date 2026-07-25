import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import CircularLoader from './CircularLoader.svelte';

// 生成検査は a11y を見ない(HOLES #19)。待ちが届くことはここで守る。
describe('CircularLoader', () => {
  it('待ちが支援技術へ届く(role=status に label が乗る)', () => {
    render(CircularLoader, { label: '読み込み中' });
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('読み込み中');
  });

  it('図形は支援技術から隠れる(意味は文字が運ぶ)', () => {
    const { container } = render(CircularLoader, { label: '読み込み中' });
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('size は既定 md で data-size に写る(loader チャンネル)', () => {
    const { container, unmount } = render(CircularLoader, { label: 'A' });
    expect(container.querySelector('.sc-circularloader')?.getAttribute('data-size')).toBe('md');
    unmount();
    const { container: c2 } = render(CircularLoader, { label: 'A', size: 'sm' });
    expect(c2.querySelector('.sc-circularloader')?.getAttribute('data-size')).toBe('sm');
  });

  it('値を持たない(不確定なので progressbar ではない)', () => {
    render(CircularLoader, { label: 'A' });
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
