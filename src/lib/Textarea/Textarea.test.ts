/**
 * 実装側テスト。TextField を継承する複数行入力(契約 extends)。TextField と共通の配線に加えて、
 * textarea 固有(複数行・rows・start/end を持たない)を検証する。
 */
import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Textarea from './Textarea.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const label = snip('<span>自己紹介</span>');
const input = (c: HTMLElement) => c.querySelector('.sc-textarea-input') as HTMLTextAreaElement;

it('textarea 要素で描画され、label が for/id で配線される(複数行。field.md §2)', () => {
  const { container } = render(Textarea, { props: { label } });
  const el = input(container);
  expect(el.tagName).toBe('TEXTAREA');
  const lbl = container.querySelector('.sc-textarea-label') as HTMLLabelElement;
  expect(lbl.htmlFor).toBe(el.id);
});

it('rows: 初期の行高を native 属性へ渡す(既定 3)', () => {
  const { container } = render(Textarea, { props: { label } });
  expect(input(container).rows).toBe(3);
  const { container: c2 } = render(Textarea, { props: { label, rows: 6 } });
  expect(input(c2).rows).toBe(6);
});

it('change: 逐次(毎入力)で発火し payload は新しい値(field.md §5)', async () => {
  const onchange = vi.fn();
  const { container } = render(Textarea, { props: { label, onchange } });
  await fireEvent.input(input(container), { target: { value: '複数行\nのテキスト' } });
  expect(onchange).toHaveBeenCalledWith('複数行\nのテキスト');
});

it('native の確定 change は部品の外へ漏れない(field.md §5。HOLES #13。TextField と同じ)', async () => {
  const outer = vi.fn();
  const { container } = render(Textarea, { props: { label } });
  container.addEventListener('change', outer);
  await fireEvent.change(input(container), { target: { value: '確定' } });
  expect(outer).not.toHaveBeenCalled();
  container.removeEventListener('change', outer);
});

it('invalid: aria-invalid と data-invalid が立ち、error は invalid のときだけ現れる(field.md §3)', () => {
  const { container } = render(Textarea, {
    props: { label, invalid: true, description: snip('<span>200字以内</span>'), error: snip('<span>長すぎる</span>') },
  });
  expect(input(container).getAttribute('aria-invalid')).toBe('true');
  const ids = (input(container).getAttribute('aria-describedby') ?? '').split(' ');
  const desc = container.querySelector('.sc-textarea-description') as HTMLElement;
  const err = container.querySelector('.sc-textarea-error') as HTMLElement;
  expect(ids).toContain(desc.id);
  expect(ids).toContain(err.id);
  const { container: c2 } = render(Textarea, { props: { label, invalid: false, error: snip('<span>x</span>') } });
  expect(c2.querySelector('.sc-textarea-error')).toBeNull();
});

it('readonly×invalid: warn して invalid を落とす(state.md §6。TextField と同じ)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { container } = render(Textarea, { props: { label, readonly: true, invalid: true } });
  expect(input(container).readOnly).toBe(true);
  expect(input(container).getAttribute('aria-invalid')).toBeNull();
  expect(warn.mock.calls.some((c) => String(c[0]).includes('readonly と invalid'))).toBe(true);
  warn.mockRestore();
});

it('start / end を持たない(複数行の器に行内アイコンは成立しない。契約が再宣言しない)', () => {
  const { container } = render(Textarea, { props: { label } });
  expect(container.querySelector('.sc-textarea-start')).toBeNull();
  expect(container.querySelector('.sc-textarea-end')).toBeNull();
});
