import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import PasswordField from './PasswordField.svelte';

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const base = {
  label: snip('パスワード'),
  revealLabel: 'パスワードを表示する',
  hideLabel: 'パスワードを隠す',
  revealedMessage: 'パスワードを表示しました',
  hiddenMessage: 'パスワードを隠しました',
};
const input = (c: HTMLElement) => c.querySelector('.sc-passwordfield-input') as HTMLInputElement;
const toggle = (c: HTMLElement) => c.querySelector('.sc-passwordfield-toggle') as HTMLButtonElement;

it('既定は隠す', () => {
  const { container } = render(PasswordField, { props: base });
  expect(input(container).type).toBe('password');
  expect(toggle(container).getAttribute('aria-label')).toBe('パスワードを表示する');
});

it('切り替えると見える。名前も入れ替わる', async () => {
  const { container } = render(PasswordField, { props: base });
  await fireEvent.click(toggle(container));
  expect(input(container).type).toBe('text');
  expect(toggle(container).getAttribute('aria-label')).toBe('パスワードを隠す');
});

it('押された状態(aria-pressed)では伝えない', async () => {
  const { container } = render(PasswordField, { props: base });
  await fireEvent.click(toggle(container));
  // 押されていることと、見えていることは利用者から見て別である
  expect(toggle(container).hasAttribute('aria-pressed')).toBe(false);
});

it('切り替えの結果を文で知らせる。値は流さない', async () => {
  const { container } = render(PasswordField, { props: { ...base, value: 'ひみつ' } });
  const live = container.querySelector('.sc-passwordfield-announcement') as HTMLElement;
  // 生きた領域は最初から居る(後から現れる領域は拾われない)
  expect(live.getAttribute('role')).toBe('status');
  expect(live.textContent).toBe('');
  await fireEvent.click(toggle(container));
  expect(live.textContent).toBe('パスワードを表示しました');
  expect(live.textContent).not.toContain('ひみつ');
  await fireEvent.click(toggle(container));
  expect(live.textContent).toBe('パスワードを隠しました');
});

it('切り替えは焦点を受ける(矢印キーのような代替が無い)', () => {
  const { container } = render(PasswordField, { props: base });
  expect(toggle(container).tabIndex).toBe(0);
});

it('値はアプリが持ち、change は逐次で来る', async () => {
  const onchange = vi.fn();
  const { container } = render(PasswordField, { props: { ...base, onchange } });
  await fireEvent.input(input(container), { target: { value: 'abc' } });
  expect(onchange).toHaveBeenLastCalledWith('abc');
});

it('autocomplete は消費者が渡す(器は決めない)', () => {
  const { container } = render(PasswordField, { props: { ...base, autocomplete: 'new-password' } });
  expect(input(container).getAttribute('autocomplete')).toBe('new-password');
});
