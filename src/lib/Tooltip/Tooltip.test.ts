import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Tooltip from './Tooltip.svelte';

// jsdom は popover API を持たない(top-layer / hover / focus での表示・位置は smoke で実機検証)。
// ここでは構造(role=tooltip)・開く向き・aria-describedby の配線を検証する。
const trigger = createRawSnippet(() => ({ render: () => '<button>保存</button>' }));
const content = createRawSnippet(() => ({ render: () => '<span>変更を保存します</span>' }));

const q = (c: HTMLElement, s: string) => c.querySelector(s) as HTMLElement;

it('trigger と content を描き、content は role=tooltip・既定の向きは上', () => {
  const { container } = render(Tooltip, { props: { trigger, content } });
  expect(q(container, '.sc-tooltip')).toBeTruthy();
  expect(q(container, 'button')).toBeTruthy();
  const tip = q(container, '.sc-tooltip-content');
  expect(tip.getAttribute('role')).toBe('tooltip');
  expect(tip.getAttribute('popover')).toBe('manual'); // auto の light dismiss には乗らない
  expect(tip.dataset.block).toBe('start'); // 測る前は placement が優先の向きになる
});

it('placement を反映する(開くまでは測らないので位置に上書きされない)', () => {
  const { container } = render(Tooltip, { props: { placement: 'block-end', trigger, content } });
  expect(q(container, '.sc-tooltip-content').dataset.block).toBe('end');
});

// 開く向きはトリガーが描画領域のどちら側に居るかで決まる(Popover と同じ規則)。
it.each([
  { at: '左上', rect: { top: 10, left: 10 }, block: 'end', inline: 'start' },
  { at: '右下', rect: { top: 700, left: 900 }, block: 'start', inline: 'end' },
])('トリガーが$atなら block=$block / inline=$inline へ開く', async ({ rect, block, inline }) => {
  const { container } = render(Tooltip, { props: { trigger, content } });
  const wrapper = q(container, '.sc-tooltip');
  wrapper.getBoundingClientRect = () =>
    ({ ...rect, width: 40, height: 20, bottom: rect.top + 20, right: rect.left + 40 }) as DOMRect;
  await fireEvent.pointerEnter(wrapper, { pointerType: 'mouse' });
  const tip = q(container, '.sc-tooltip-content');
  expect(tip.dataset.block).toBe(block);
  expect(tip.dataset.inline).toBe(inline);
});

it('トリガーの対話要素に aria-describedby=tooltip の id を配線する', () => {
  const { container } = render(Tooltip, { props: { trigger, content } });
  const btn = q(container, 'button');
  const tip = q(container, '.sc-tooltip-content');
  expect(btn.getAttribute('aria-describedby')).toBe(tip.id);
});

it('対話要素が無ければラッパーへ配線する(退化)', () => {
  const plain = createRawSnippet(() => ({ render: () => '<span>アイコン</span>' }));
  const { container } = render(Tooltip, { props: { trigger: plain, content } });
  const wrapper = q(container, '.sc-tooltip');
  const tip = q(container, '.sc-tooltip-content');
  expect(wrapper.getAttribute('aria-describedby')).toBe(tip.id);
});

it('tabindex=-1(実タブ移動しない管理用)は飛ばし、実フォーカス可能要素へ配線する', () => {
  const nested = createRawSnippet(() => ({
    render: () => '<span tabindex="-1"><button>実操作</button></span>',
  }));
  const { container } = render(Tooltip, { props: { trigger: nested, content } });
  const btn = q(container, 'button');
  const span = container.querySelector('span[tabindex="-1"]') as HTMLElement;
  const tip = q(container, '.sc-tooltip-content');
  expect(btn.getAttribute('aria-describedby')).toBe(tip.id);
  expect(span.hasAttribute('aria-describedby')).toBe(false);
});
