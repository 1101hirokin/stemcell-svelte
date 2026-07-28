/**
 * 実装側テスト。適合テストが照合できない配線と挙動を検証する: 環境の選択が土台であること、
 * 落とす・貼る経路の絞り込みと告知、値の持ち方。
 */
import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { expect, it, vi } from 'vitest';
import FileField from './FileField.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const label = snip('<span>添付</span>');
const input = (c: HTMLElement) => c.querySelector('.sc-filefield-input') as HTMLInputElement;
const file = (name: string, type: string) => new File(['x'], name, { type });

it('土台は環境のファイル選択である(入力は消さずに重ねる)', () => {
  const { container } = render(FileField, { props: { label, triggerLabel: 'ファイルを選ぶ' } });
  const el = input(container);
  expect(el.type).toBe('file');
  // display:none にすると焦点が当たらない。透明で重ねる(CSS の宣言を検査)
  expect(container.querySelector('.sc-filefield-trigger')?.contains(el)).toBe(true);
});

it('選ぶ操作の名前は消費者が渡す', () => {
  const { container } = render(FileField, { props: { label, triggerLabel: '請求書を選ぶ' } });
  expect(container.querySelector('.sc-filefield-trigger-face')?.textContent).toBe('請求書を選ぶ');
});

it('accept は MIME 型の列を native へ渡す', () => {
  const { container } = render(FileField, {
    props: { label, triggerLabel: '選ぶ', accept: ['image/*', '.csv'] },
  });
  expect(input(container).getAttribute('accept')).toBe('image/*,.csv');
});

it('カメラとフォルダと複数選択を native へ渡す', () => {
  const { container } = render(FileField, {
    props: { label, triggerLabel: '選ぶ', capture: 'environment', directory: true, multiple: true },
  });
  const el = input(container);
  expect(el.getAttribute('capture')).toBe('environment');
  expect(el.hasAttribute('webkitdirectory')).toBe(true);
  expect(el.multiple).toBe(true);
});

it('落ちてきたものを受け取り、accept に合わないものは弾く', async () => {
  const onchange = vi.fn();
  const onreject = vi.fn();
  const { container, component } = render(FileField, {
    props: {
      label,
      triggerLabel: '選ぶ',
      accept: ['image/*'],
      multiple: true,
      onchange,
      onreject,
      receivedLabel: '{n} 件を受け取りました',
      rejectedLabel: '{n} 件は受け取れません',
    },
  });
  (component as unknown as { accepted: (f: File[]) => void }).accepted([
    file('a.png', 'image/png'),
    file('b.pdf', 'application/pdf'),
  ]);
  await Promise.resolve();
  expect(onchange).toHaveBeenCalledWith([expect.objectContaining({ name: 'a.png' })]);
  expect(onreject).toHaveBeenCalledWith([expect.objectContaining({ name: 'b.pdf' })]);
  const live = container.querySelector('.sc-filefield-announcement') as HTMLElement;
  expect(live.getAttribute('role')).toBe('status');
  expect(live.textContent).toBe('1 件を受け取りました 1 件は受け取れません');
});

it('複数を許さない欄は、落ちてきた中の一つだけを取る', async () => {
  const onchange = vi.fn();
  const { component } = render(FileField, { props: { label, triggerLabel: '選ぶ', onchange } });
  (component as unknown as { accepted: (f: File[]) => void }).accepted([
    file('a.png', 'image/png'),
    file('b.png', 'image/png'),
  ]);
  await Promise.resolve();
  expect(onchange).toHaveBeenCalledWith([expect.objectContaining({ name: 'a.png' })]);
});

it('貼り付けは焦点があるときだけ受ける', async () => {
  const onchange = vi.fn();
  const { container } = render(FileField, {
    props: { label, triggerLabel: '選ぶ', onchange, receivedLabel: '{n} 件' },
  });
  const paste = (files: File[]) => {
    const e = new Event('paste') as ClipboardEvent;
    Object.defineProperty(e, 'clipboardData', { value: { files } });
    document.dispatchEvent(e);
  };
  paste([file('a.png', 'image/png')]);
  await Promise.resolve();
  expect(onchange).not.toHaveBeenCalled(); // 焦点が無いあいだは受けない

  await fireEvent.focusIn(container.querySelector('.sc-filefield')!);
  paste([file('a.png', 'image/png')]);
  await Promise.resolve();
  expect(onchange).toHaveBeenCalledWith([expect.objectContaining({ name: 'a.png' })]);
});

it('打てない欄では受け取らない', async () => {
  const onchange = vi.fn();
  const { component } = render(FileField, {
    props: { label, triggerLabel: '選ぶ', disabled: true, onchange },
  });
  (component as unknown as { accepted: (f: File[]) => void }).accepted([file('a.png', 'image/png')]);
  await Promise.resolve();
  expect(onchange).not.toHaveBeenCalled();
});
