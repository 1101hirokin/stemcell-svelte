import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
  expect(c.dataset.block).toBe('end'); // 測る前は placement が優先の向きになる
  expect(c.dataset.inline).toBe('center'); // 左右はトリガーの中心に揃えるのが既定
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

it('placement=block-start を尊重する(開くまでは測らないので位置に上書きされない)', () => {
  const { container } = render(Popover, { props: { open: false, placement: 'block-start', anchor, content } });
  expect((container.querySelector('.sc-popover-content') as HTMLElement).dataset.block).toBe('start');
});

// 上下はトリガーが描画領域のどちら側に居るかで決まる。左右はトリガーの始端に揃え、
// 揃えたままでは端をはみ出すときだけ終端へ寄る(面の幅 300px、描画領域 1024x768 で計算)。
it.each([
  { at: '中ほど', rect: { top: 10, left: 480 }, block: 'end', inline: 'center' },
  { at: '左上', rect: { top: 10, left: 10 }, block: 'end', inline: 'start' },
  { at: '右下', rect: { top: 700, left: 900 }, block: 'start', inline: 'end' },
  { at: '右上', rect: { top: 10, left: 900 }, block: 'end', inline: 'end' },
  { at: '左下', rect: { top: 700, left: 10 }, block: 'start', inline: 'start' },
])('トリガーが$atなら block=$block / inline=$inline へ開く', async ({ rect, block, inline }) => {
  const { container, rerender } = render(Popover, { props: { open: false, anchor, content } });
  const wrapper = container.querySelector('.sc-popover') as HTMLElement;
  wrapper.getBoundingClientRect = () =>
    ({ ...rect, width: 40, height: 20, bottom: rect.top + 20, right: rect.left + 40 }) as DOMRect;
  // jsdom は描画しないので面の幅を与える(揃えたままで収まるかの判定に使う)
  Object.defineProperty(container.querySelector('.sc-popover-content'), 'offsetWidth', { value: 300 });
  await rerender({ open: true });
  const c = container.querySelector('.sc-popover-content') as HTMLElement;
  expect(c.dataset.block).toBe(block);
  expect(c.dataset.inline).toBe(inline);
});

it('面の下限は中身の幅である(アンカーより広い中身が切れない)', () => {
  // 実測できない代わりに、出荷される CSS の宣言を検査する。
  // min() の中へ max-content のような内在の値を書くと宣言ごと無効になり、下限が 0 へ落ちて
  // 絵だけのトリガーに付くメニューが 45px に潰れる(2026-07-29 の報告。一度その形で壊した)
  const css = readFileSync(join(import.meta.dirname, 'Popover.css'), 'utf-8');
  expect(css).toContain('min-inline-size: var(--sc-popover-min-inline-size, max-content)');
  expect(css).not.toMatch(/min-inline-size:\s*min\(/);
});
