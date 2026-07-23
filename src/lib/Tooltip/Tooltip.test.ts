import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Tooltip from './Tooltip.svelte';

// jsdom は popover API を持たない(top-layer / hover / focus での表示・位置は smoke で実機検証)。
// ここでは構造(role=tooltip)・既定 placement・aria-describedby の配線を検証する。
const trigger = createRawSnippet(() => ({ render: () => '<button>保存</button>' }));
const content = createRawSnippet(() => ({ render: () => '<span>変更を保存します</span>' }));

const q = (c: HTMLElement, s: string) => c.querySelector(s) as HTMLElement;

it('trigger と content を描き、content は role=tooltip・既定 placement は block-start', () => {
  const { container } = render(Tooltip, { props: { trigger, content } });
  expect(q(container, '.sc-tooltip')).toBeTruthy();
  expect(q(container, 'button')).toBeTruthy();
  const tip = q(container, '.sc-tooltip-content');
  expect(tip.getAttribute('role')).toBe('tooltip');
  expect(tip.getAttribute('popover')).toBe('manual'); // auto の light dismiss には乗らない
  expect(tip.dataset.placement).toBe('block-start');
});

it('placement を反映する', () => {
  const { container } = render(Tooltip, { props: { placement: 'block-end', trigger, content } });
  expect(q(container, '.sc-tooltip-content').dataset.placement).toBe('block-end');
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
