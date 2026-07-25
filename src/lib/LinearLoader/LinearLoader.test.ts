import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import LinearLoader from './LinearLoader.svelte';

describe('LinearLoader', () => {
  it('待ちが支援技術へ届く(role=status に label が乗る)', () => {
    render(LinearLoader, { label: '検索中' });
    expect(screen.getByRole('status').textContent).toContain('検索中');
  });

  it('帯は支援技術から隠れる(意味は文字が運ぶ)', () => {
    const { container } = render(LinearLoader, { label: '検索中' });
    expect(container.querySelector('.sc-linearloader-indicator')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('値を持たない(不確定なので progressbar ではない)', () => {
    render(LinearLoader, { label: 'A' });
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
