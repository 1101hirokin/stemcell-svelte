/**
 * 実装側テスト。通知のホスト(Toaster.md)。キューとタイマーは internal/toast-store が持ち、
 * ここは置き場所の既定だけを見る。
 */
import { render } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import Toaster from './Toaster.svelte';
it('既定の隅は下の中央(裁定 2026-07-28。触点で親指に近く、視線の移動が短い)', () => {
  const { container } = render(Toaster, { props: {} });
  const el = container.querySelector('.sc-toaster') as HTMLElement;
  expect(el.dataset.block).toBe('block-end');
  expect(el.dataset.inline).toBe('inline-center');
});
