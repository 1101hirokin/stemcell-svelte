import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Button from './Button.svelte';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(import.meta.dirname, 'Button.css'), 'utf-8');

const label = createRawSnippet(() => ({ render: () => '<span>save</span>' }));

it('ラベル必須のボタンとして描画され、既定は filled/primary/md', async () => {
  render(Button, { props: { children: label } });
  const b = screen.getByRole('button');
  expect(b.dataset.variant).toBe('filled');
  expect(b.dataset.color).toBe('primary');
  expect(b.dataset.size).toBe('md');
});

it('disabled のとき活性化(click)が発火しない(state.md §3.2)', async () => {
  let fired = 0;
  render(Button, { props: { children: label, disabled: true, onclick: () => fired++ } });
  const b = screen.getByRole('button') as HTMLButtonElement;
  b.click();
  expect(fired).toBe(0);
  expect(b.disabled).toBe(true);
});

it('type: 既定は button(form 内の暗黙送信を塞ぐ。Button.md §6。HOLES #24)', () => {
  render(Button, { props: { children: label } });
  expect((screen.getByRole('button') as HTMLButtonElement).type).toBe('button');
});

it('type: submit を指定すると form が実際に送信される(既定 button では送信されない)', async () => {
  const submitLabel = createRawSnippet(() => ({ render: () => '<span>送信</span>' }));
  // 既定(button): form 内でも submit しない
  const form1 = document.createElement('form');
  document.body.appendChild(form1);
  let submitted = 0;
  form1.addEventListener('submit', (e) => { e.preventDefault(); submitted++; });
  const { container } = render(Button, { props: { children: submitLabel }, target: form1 });
  (container.querySelector('.sc-button') as HTMLButtonElement).click();
  expect(submitted, '既定 button で送信された').toBe(0);
  form1.remove();
  // type=submit: 送信される
  const form2 = document.createElement('form');
  document.body.appendChild(form2);
  form2.addEventListener('submit', (e) => { e.preventDefault(); submitted++; });
  const r2 = render(Button, { props: { children: submitLabel, type: 'submit' }, target: form2 });
  (r2.container.querySelector('.sc-button') as HTMLButtonElement).click();
  expect(submitted, 'type=submit で送信されない').toBe(1);
  form2.remove();
});

// prop を改名すると、template の data 属性と CSS の選択子が別々に動きうる。属性名の大小は
// HTML では無視されるので綴りがズレても描画は壊れないが、綴りが二通りある状態は読む人を迷わせる。
// 名前が一箇所ずつ手で書かれている以上、機械で突き合わせておく(RFC 0025 で fullWidth へ改名)。
it('fullWidth の data 属性の綴りが CSS の選択子と揃っている', () => {
  const { container } = render(Button, { props: { children: label, fullWidth: true } });
  const el = container.querySelector('.sc-button')!;
  const names = el.getAttributeNames().filter((n) => n.startsWith('data-'));
  expect(names).toContain('data-fullwidth');
  expect(names.every((n) => n === n.toLowerCase()), `大文字混じりの data 属性: ${names}`).toBe(true);
  expect(css, 'CSS がその綴りで選んでいる').toContain("[data-fullwidth='true']");
});
