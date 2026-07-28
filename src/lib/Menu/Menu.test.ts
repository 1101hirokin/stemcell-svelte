import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { vi } from 'vitest';
import Menu from './Menu.svelte';

// jsdom は popover API を持たないので Popover の content は常に DOM にある(Popover.svelte)。
// ここでは Menu のロジック(ARIA 配線・roving 実 DOM フォーカス・活性化・閉じ)を検証する。
// native の light dismiss(外側クリック)と top-layer は smoke(実 Chromium)で見る。
const trigger = createRawSnippet(() => ({ render: () => '<span>操作</span>' }));
const items = [
  { id: 'edit', label: '編集' },
  { id: 'dup', label: '複製' },
  { id: 'del', label: '削除', disabled: true },
  { id: 'share', label: '共有' },
];

const q = (c: HTMLElement, s: string) => c.querySelector(s) as HTMLElement;
const qa = (c: HTMLElement, s: string) => [...c.querySelectorAll(s)] as HTMLElement[];

it('トリガーは role=button + aria-haspopup=menu + aria-expanded=false で描く', () => {
  const { container } = render(Menu, { props: { items, trigger } });
  const t = q(container, '.sc-menu-trigger');
  expect(t.getAttribute('aria-haspopup')).toBe('menu');
  expect(t.getAttribute('aria-expanded')).toBe('false');
  expect(t.getAttribute('aria-controls')).toBe(q(container, '[role="menu"]').id);
});

it('クリックで開き、項目が role=menuitem で並ぶ(disabled は aria-disabled)', async () => {
  const { container } = render(Menu, { props: { items, trigger } });
  await fireEvent.click(q(container, '.sc-menu-trigger'));
  await tick();
  expect(q(container, '.sc-menu-trigger').getAttribute('aria-expanded')).toBe('true');
  const mi = qa(container, '[role="menuitem"]');
  expect(mi).toHaveLength(4);
  expect(mi[2].getAttribute('aria-disabled')).toBe('true');
});

it('閉じたトリガーで ArrowDown 押下すると開き、先頭 menuitem を実フォーカスする(roving)', async () => {
  const { container } = render(Menu, { props: { items, trigger } });
  await fireEvent.keyDown(q(container, '.sc-menu-trigger'), { key: 'ArrowDown' });
  await tick();
  const mi = qa(container, '[role="menuitem"]');
  expect(mi[0].getAttribute('tabindex')).toBe('0');
  expect(document.activeElement).toBe(mi[0]);
});

it('ArrowUp で開くと末尾(有効な最後)の menuitem へ', async () => {
  const { container } = render(Menu, { props: { items, trigger } });
  await fireEvent.keyDown(q(container, '.sc-menu-trigger'), { key: 'ArrowUp' });
  await tick();
  const mi = qa(container, '[role="menuitem"]');
  expect(document.activeElement).toBe(mi[3]); // 末尾は share(del は disabled で飛ばす)
});

it('矢印は disabled 項目を飛ばして roving する', async () => {
  const { container } = render(Menu, { props: { items, trigger } });
  await fireEvent.keyDown(q(container, '.sc-menu-trigger'), { key: 'ArrowDown' }); // edit
  await tick();
  const menu = q(container, '[role="menu"]');
  await fireEvent.keyDown(menu, { key: 'ArrowDown' }); // dup
  await tick();
  await fireEvent.keyDown(menu, { key: 'ArrowDown' }); // del を飛ばして share
  await tick();
  expect(document.activeElement).toBe(qa(container, '[role="menuitem"]')[3]);
});

it('Enter で活性化して onselect(id) を発火し閉じる。フォーカスはトリガーへ戻る', async () => {
  const onselect = vi.fn();
  const { container } = render(Menu, { props: { items, trigger, onselect } });
  await fireEvent.keyDown(q(container, '.sc-menu-trigger'), { key: 'ArrowDown' }); // edit を active
  await tick();
  await fireEvent.keyDown(q(container, '[role="menu"]'), { key: 'Enter' });
  await tick();
  expect(onselect).toHaveBeenCalledWith('edit');
  expect(q(container, '.sc-menu-trigger').getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(q(container, '.sc-menu-trigger'));
});

it('Space も活性化する(menu は Enter/Space の両方。listbox と分かれる)', async () => {
  const onselect = vi.fn();
  const { container } = render(Menu, { props: { items, trigger, onselect } });
  await fireEvent.keyDown(q(container, '.sc-menu-trigger'), { key: 'ArrowDown' });
  await tick();
  await fireEvent.keyDown(q(container, '[role="menu"]'), { key: ' ' });
  await tick();
  expect(onselect).toHaveBeenCalledWith('edit');
});

it('項目クリックで onselect(id) を発火して閉じる', async () => {
  const onselect = vi.fn();
  const { container } = render(Menu, { props: { items, trigger, onselect } });
  await fireEvent.click(q(container, '.sc-menu-trigger'));
  await tick();
  await fireEvent.click(qa(container, '[role="menuitem"]')[1]); // 複製
  await tick();
  expect(onselect).toHaveBeenCalledWith('dup');
  expect(q(container, '.sc-menu-trigger').getAttribute('aria-expanded')).toBe('false');
});

it('disabled 項目は活性化しない', async () => {
  const onselect = vi.fn();
  const { container } = render(Menu, { props: { items, trigger, onselect } });
  await fireEvent.click(q(container, '.sc-menu-trigger'));
  await tick();
  await fireEvent.click(qa(container, '[role="menuitem"]')[2]); // 削除(disabled)
  await tick();
  expect(onselect).not.toHaveBeenCalled();
  expect(q(container, '.sc-menu-trigger').getAttribute('aria-expanded')).toBe('true'); // 開いたまま
});

it('Escape で閉じてトリガーへフォーカスを戻す', async () => {
  const { container } = render(Menu, { props: { items, trigger } });
  await fireEvent.keyDown(q(container, '.sc-menu-trigger'), { key: 'ArrowDown' });
  await tick();
  await fireEvent.keyDown(q(container, '[role="menu"]'), { key: 'Escape' });
  await tick();
  expect(q(container, '.sc-menu-trigger').getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(q(container, '.sc-menu-trigger'));
});

it('disabled な Menu は開かない', async () => {
  const { container } = render(Menu, { props: { items, trigger, disabled: true } });
  await fireEvent.click(q(container, '.sc-menu-trigger'));
  await tick();
  expect(q(container, '.sc-menu-trigger').getAttribute('aria-expanded')).toBe('false');
});

it('Home / End で端の menuitem へ roving する(disabled は端から飛ばす)', async () => {
  const { container } = render(Menu, { props: { items, trigger } });
  await fireEvent.keyDown(q(container, '.sc-menu-trigger'), { key: 'ArrowDown' });
  await tick();
  const menu = q(container, '[role="menu"]');
  await fireEvent.keyDown(menu, { key: 'End' });
  await tick();
  expect(document.activeElement).toBe(qa(container, '[role="menuitem"]')[3]); // share(del は disabled)
  await fireEvent.keyDown(menu, { key: 'Home' });
  await tick();
  expect(document.activeElement).toBe(qa(container, '[role="menuitem"]')[0]); // edit
});

it('再度開くと activeIndex はリセットされ先頭から(前回位置を持ち越さない)', async () => {
  const { container } = render(Menu, { props: { items, trigger } });
  const t = q(container, '.sc-menu-trigger');
  await fireEvent.keyDown(t, { key: 'ArrowDown' });
  await tick();
  await fireEvent.keyDown(q(container, '[role="menu"]'), { key: 'ArrowDown' }); // dup を active に
  await tick();
  await fireEvent.keyDown(q(container, '[role="menu"]'), { key: 'Escape' });
  await tick();
  await fireEvent.keyDown(t, { key: 'ArrowDown' }); // 再開
  await tick();
  expect(document.activeElement).toBe(qa(container, '[role="menuitem"]')[0]); // 先頭に戻る
});

it('items が空のメニューは開かない(退化ケース)', async () => {
  const { container } = render(Menu, { props: { items: [], trigger } });
  await fireEvent.click(q(container, '.sc-menu-trigger'));
  await tick();
  expect(q(container, '.sc-menu-trigger').getAttribute('aria-expanded')).toBe('false');
});

it('全項目 disabled では開くが menu 容部品へフォーカスし、Escape で閉じられる(退化ケース)', async () => {
  const allDisabled = [
    { id: 'a', label: 'A', disabled: true },
    { id: 'b', label: 'B', disabled: true },
  ];
  const { container } = render(Menu, { props: { items: allDisabled, trigger } });
  const t = q(container, '.sc-menu-trigger');
  await fireEvent.keyDown(t, { key: 'ArrowDown' });
  await tick();
  expect(t.getAttribute('aria-expanded')).toBe('true');
  const menu = q(container, '[role="menu"]');
  expect(document.activeElement).toBe(menu); // 動かせる項目が無いので容部品へ
  expect(qa(container, '[role="menuitem"]').every((el) => el.getAttribute('tabindex') === '-1')).toBe(true);
  await fireEvent.keyDown(menu, { key: 'Escape' });
  await tick();
  expect(t.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(t);
});

it('menu 容部品は aria-labelledby でトリガーを指す(APG menu button)', () => {
  const { container } = render(Menu, { props: { items, trigger } });
  const menu = q(container, '[role="menu"]');
  expect(menu.getAttribute('aria-labelledby')).toBe(q(container, '.sc-menu-trigger').id);
});
