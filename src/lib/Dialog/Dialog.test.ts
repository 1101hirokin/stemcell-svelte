import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Dialog from './Dialog.svelte';

// jsdom は <dialog>.showModal を持たない(top-layer / focus trap / native Escape は smoke で実機検証)。
// ここでは open→close の橋渡し、dismiss=light/explicit の分岐、背後クリックの見分け、aria 配線を検証する。
const title = createRawSnippet(() => ({ render: () => '<span>削除の確認</span>' }));
const content = createRawSnippet(() => ({ render: () => '<span>この操作は取り消せません。</span>' }));
const actions = createRawSnippet(() => ({ render: () => '<button>閉じる</button>' }));

const dlg = (c: HTMLElement) => c.querySelector('.sc-dialog') as HTMLDialogElement;

it('dialog を描き、aria-labelledby が title を指す。title/content/actions が出る', () => {
  const { container } = render(Dialog, { props: { open: true, title, content, actions } });
  const d = dlg(container);
  expect(d.tagName).toBe('DIALOG');
  expect(d.getAttribute('aria-labelledby')).toBe(container.querySelector('.sc-dialog-title')!.id);
  expect(container.querySelector('.sc-dialog-content')).toBeTruthy();
  expect(container.querySelector('.sc-dialog-actions')).toBeTruthy();
});

it('actions は省略できる', () => {
  const { container } = render(Dialog, { props: { open: true, title, content } });
  expect(container.querySelector('.sc-dialog-actions')).toBeNull();
});

it('light: 背後(scrim)で押して背後で離すと openchange(false)', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Dialog, { props: { open: true, title, content, onopenchange } });
  const d = dlg(container);
  await fireEvent.pointerDown(d); // 押下も背後
  await fireEvent.click(d); // 解放も背後
  expect(onopenchange).toHaveBeenCalledWith(false);
});

it('light: パネル内で押して背後で離すドラッグ選択では閉じない(誤爆防止)', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Dialog, { props: { open: true, title, content, onopenchange } });
  await fireEvent.pointerDown(container.querySelector('.sc-dialog-content')!); // 押下はパネル内
  await fireEvent.click(dlg(container)); // click の target は共通祖先の dialog になる
  expect(onopenchange).not.toHaveBeenCalled();
});

it('light: パネル内クリックは閉じない(target が子要素)', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Dialog, { props: { open: true, title, content, onopenchange } });
  const panel = container.querySelector('.sc-dialog-panel')!;
  await fireEvent.pointerDown(panel);
  await fireEvent.click(panel);
  expect(onopenchange).not.toHaveBeenCalled();
});

it('explicit: 背後クリックでは閉じない', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Dialog, {
    props: { open: true, dismiss: 'explicit', title, content, onopenchange },
  });
  const d = dlg(container);
  await fireEvent.pointerDown(d);
  await fireEvent.click(d);
  expect(onopenchange).not.toHaveBeenCalled();
});

it('explicit: Escape(cancel)を握りつぶし、openchange を発火しない', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Dialog, {
    props: { open: true, dismiss: 'explicit', title, content, onopenchange },
  });
  const ev = new Event('cancel', { cancelable: true });
  const notPrevented = dlg(container).dispatchEvent(ev);
  expect(notPrevented).toBe(false); // preventDefault された
  expect(onopenchange).not.toHaveBeenCalled();
});

it('light: Escape(cancel)は握りつぶさない(native が閉じ、close で橋渡し)', async () => {
  const { container } = render(Dialog, { props: { open: true, title, content } });
  const ev = new Event('cancel', { cancelable: true });
  const notPrevented = dlg(container).dispatchEvent(ev);
  expect(notPrevented).toBe(true); // preventDefault されない
});

it('native の close で openchange(false) を橋渡しする(open=true のとき)', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Dialog, { props: { open: true, title, content, onopenchange } });
  await fireEvent(dlg(container), new Event('close'));
  expect(onopenchange).toHaveBeenCalledWith(false);
});

it('自分で閉じた(open=false)ときの close では二重発火しない', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Dialog, { props: { open: false, title, content, onopenchange } });
  await fireEvent(dlg(container), new Event('close'));
  expect(onopenchange).not.toHaveBeenCalled();
});
