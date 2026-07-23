import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Drawer from './Drawer.svelte';

// jsdom は <dialog>.showModal を持たない(top-layer / focus trap / スライドは smoke で実機検証)。
// ここでは open→close の橋渡し、dismiss=light/explicit の分岐、背後クリックの見分け、side / aria 配線を検証する。
const title = createRawSnippet(() => ({ render: () => '<span>フィルタ</span>' }));
const content = createRawSnippet(() => ({ render: () => '<span>絞り込み条件</span>' }));
const actions = createRawSnippet(() => ({ render: () => '<button>閉じる</button>' }));

const dlg = (c: HTMLElement) => c.querySelector('.sc-drawer') as HTMLDialogElement;

it('dialog を描き、既定 side=inline-end・aria-labelledby が title を指す', () => {
  const { container } = render(Drawer, { props: { open: true, title, content, actions } });
  const d = dlg(container);
  expect(d.tagName).toBe('DIALOG');
  expect(d.dataset.side).toBe('inline-end');
  expect(d.getAttribute('aria-labelledby')).toBe(container.querySelector('.sc-drawer-title')!.id);
  expect(container.querySelector('.sc-drawer-content')).toBeTruthy();
  expect(container.querySelector('.sc-drawer-actions')).toBeTruthy();
});

it('side を反映する', () => {
  const { container } = render(Drawer, { props: { open: true, side: 'inline-start', title, content } });
  expect(dlg(container).dataset.side).toBe('inline-start');
});

it('light: 背後で押して背後で離すと openchange(false)', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Drawer, { props: { open: true, title, content, onopenchange } });
  const d = dlg(container);
  await fireEvent.pointerDown(d);
  await fireEvent.click(d);
  expect(onopenchange).toHaveBeenCalledWith(false);
});

it('light: パネル内で押して背後で離すドラッグでは閉じない(誤爆防止)', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Drawer, { props: { open: true, title, content, onopenchange } });
  await fireEvent.pointerDown(container.querySelector('.sc-drawer-content')!);
  await fireEvent.click(dlg(container));
  expect(onopenchange).not.toHaveBeenCalled();
});

it('explicit: 背後クリックでは閉じない。Escape(cancel)を握りつぶす', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Drawer, {
    props: { open: true, dismiss: 'explicit', title, content, onopenchange },
  });
  const d = dlg(container);
  await fireEvent.pointerDown(d);
  await fireEvent.click(d);
  expect(onopenchange).not.toHaveBeenCalled();
  const ev = new Event('cancel', { cancelable: true });
  const notPrevented = d.dispatchEvent(ev);
  expect(notPrevented).toBe(false); // preventDefault された
});

it('native の close で openchange(false) を橋渡しする(open=true のとき)', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Drawer, { props: { open: true, title, content, onopenchange } });
  await fireEvent(dlg(container), new Event('close'));
  expect(onopenchange).toHaveBeenCalledWith(false);
});

it('自分で閉じた(open=false)ときの close では二重発火しない', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Drawer, { props: { open: false, title, content, onopenchange } });
  await fireEvent(dlg(container), new Event('close'));
  expect(onopenchange).not.toHaveBeenCalled();
});
