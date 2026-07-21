/**
 * 実装側テスト。適合テスト(自動生成)が照合できない配線と挙動を検証する:
 * label/description/error の a11y 配線、change の逐次性、native 確定 change の遮断
 * (field.md §5 の Lit/Svelte 非対称への申し送り)、readonly×invalid の排他。
 */
import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import TextField from './TextField.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const label = snip('<span>氏名</span>');
const input = (c: HTMLElement) => c.querySelector('.sc-textfield-input') as HTMLInputElement;

it('label: for/id で input の名前として配線される(field.md §2)', () => {
  const { container } = render(TextField, { props: { label } });
  const el = container.querySelector('.sc-textfield-label') as HTMLLabelElement;
  expect(el.getAttribute('for')).toBe(input(container).id);
  expect(el.textContent).toContain('氏名');
});

it('change: 逐次(毎入力)で発火し、payload は新しい値(field.md §5)', async () => {
  const onchange = vi.fn();
  const { container } = render(TextField, { props: { label, onchange } });
  await fireEvent.input(input(container), { target: { value: 'あい' } });
  expect(onchange).toHaveBeenCalledTimes(1);
  expect(onchange).toHaveBeenCalledWith('あい');
});

it('native の確定 change は部品の外へ漏れない(field.md §5: Svelte は light DOM のため構造的保護が無い。実装が止める)', async () => {
  const onchange = vi.fn();
  const outer = vi.fn();
  const { container } = render(TextField, { props: { label, onchange } });
  container.addEventListener('change', outer);
  await fireEvent.change(input(container), { target: { value: '確定' } });
  expect(outer, '確定 change が light DOM を伝播した').not.toHaveBeenCalled();
  expect(onchange, '確定 change が契約の change に化けた').not.toHaveBeenCalled();
  container.removeEventListener('change', outer);
});

it('description と error は並置され、両方が aria-describedby で説明として届く(field.md §3)', () => {
  const { container } = render(TextField, {
    props: {
      label,
      invalid: true,
      description: snip('<span>8文字以上</span>'),
      error: snip('<span>短すぎる</span>'),
    },
  });
  const desc = container.querySelector('.sc-textfield-description') as HTMLElement;
  const err = container.querySelector('.sc-textfield-error') as HTMLElement;
  expect(desc.textContent).toContain('8文字以上');
  expect(err.textContent).toContain('短すぎる');
  const ids = (input(container).getAttribute('aria-describedby') ?? '').split(' ');
  expect(ids).toContain(desc.id);
  expect(ids).toContain(err.id);
});

it('error 部位は invalid のときだけ現れる(field.md §2: error の必須条件は invalid)', () => {
  const { container } = render(TextField, {
    props: { label, invalid: false, error: snip('<span>短すぎる</span>') },
  });
  expect(container.querySelector('.sc-textfield-error')).toBeNull();
});

it('invalid: aria-invalid が状態として届き、intent が danger へ差し替わる(data-invalid)', () => {
  const { container } = render(TextField, { props: { label, invalid: true } });
  expect(input(container).getAttribute('aria-invalid')).toBe('true');
  expect((container.querySelector('.sc-textfield') as HTMLElement).dataset.invalid).toBe('true');
});

it('readonly×invalid: 同時に成立しない(state.md §6)。warn して invalid を落とす', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { container } = render(TextField, { props: { label, readonly: true, invalid: true } });
  expect(input(container).readOnly).toBe(true);
  expect(input(container).getAttribute('aria-invalid')).toBeNull();
  expect(warn.mock.calls.some((c) => String(c[0]).includes('readonly と invalid'))).toBe(true);
  warn.mockRestore();
});

it('required: native 属性で届き、視覚標示を部品が自動で出す(field.md §4。記号は aria-hidden)', () => {
  const { container } = render(TextField, { props: { label, required: true } });
  expect(input(container).required).toBe(true);
  const marker = container.querySelector('.sc-textfield-required') as HTMLElement;
  expect(marker.getAttribute('aria-hidden')).toBe('true');
});

it('disabled / placeholder / autocomplete / keyboard は native 属性へ写る(契約の mirrorsNativeAttr)', () => {
  const { container } = render(TextField, {
    props: {
      label,
      disabled: true,
      placeholder: '例: 山田太郎',
      autocomplete: 'name',
      keyboard: 'email',
    },
  });
  const el = input(container);
  expect(el.disabled).toBe(true);
  expect(el.getAttribute('placeholder')).toBe('例: 山田太郎');
  expect(el.getAttribute('autocomplete')).toBe('name');
  expect(el.getAttribute('inputmode')).toBe('email');
});
