import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Popover from './Popover.svelte';

const anchor = createRawSnippet(() => ({ render: () => '<button>開く</button>' }));
const content = createRawSnippet(() => ({ render: () => '<div>中身</div>' }));

// native popover API(top-layer)へ移行(overlay-stack correctness。Step 0)。Escape / 外側クリックの
// light dismiss と多重時の LIFO はブラウザが管理するため、それらは smoke(実 Chromium)で検証する。
// jsdom は popover API を持たないので、ここでは DOM 構成と onopenchange の橋渡しを検証する。

it('anchor と content を描き、content は popover 要素で既定の開き方向は block-end', () => {
  const { container } = render(Popover, { props: { open: false, anchor, content } });
  expect(container.querySelector('.sc-popover')).toBeTruthy();
  expect(container.querySelector('button')).toBeTruthy();
  const c = container.querySelector('.sc-popover-content') as HTMLElement;
  expect(c).toBeTruthy();
  expect(c.getAttribute('popover')).toBe('auto'); // top-layer で light dismiss を native に委ねる
  expect(c.dataset.placement).toBe('block-end');
});

it('native の light dismiss(toggle=closed)で openchange(false) を橋渡しする', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Popover, { props: { open: true, anchor, content, onopenchange } });
  const c = container.querySelector('.sc-popover-content') as HTMLElement;
  // ブラウザが Escape / 外側で閉じると toggle(newState=closed)が飛ぶ。それを再現
  const e = new Event('toggle');
  (e as unknown as { newState: string }).newState = 'closed';
  c.dispatchEvent(e);
  expect(onopenchange).toHaveBeenCalledWith(false);
});

it('自分で閉じた(open=false)ときの toggle では二重発火しない', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Popover, { props: { open: false, anchor, content, onopenchange } });
  const c = container.querySelector('.sc-popover-content') as HTMLElement;
  const e = new Event('toggle');
  (e as unknown as { newState: string }).newState = 'closed';
  c.dispatchEvent(e);
  expect(onopenchange).not.toHaveBeenCalled(); // open が false のとき橋渡ししない
});

it('フォーカスがラッパーの外へ出たら openchange(false)(Escape/外側は native、focusout は自前)', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Popover, { props: { open: true, anchor, content, onopenchange } });
  const outside = document.createElement('button');
  document.body.appendChild(outside);
  outside.focus(); // フォーカスを外へ
  await fireEvent.focusOut(container.querySelector('.sc-popover') as HTMLElement);
  await Promise.resolve(); // queueMicrotask を消化
  expect(onopenchange).toHaveBeenCalledWith(false);
  outside.remove();
});

it('placement=block-start を尊重する(反転は衝突時のみ。jsdom では反転しない)', () => {
  const { container } = render(Popover, { props: { open: false, placement: 'block-start', anchor, content } });
  expect((container.querySelector('.sc-popover-content') as HTMLElement).dataset.placement).toBe('block-start');
});
