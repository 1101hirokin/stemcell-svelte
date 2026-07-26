/**
 * 生成される適合検査は props と必須トークンの CSS 参照しか照合しない(HOLES #19)。
 * ここでは生成の進行の到達性(aria-busy と名前の live region)と、畳みの結線を守る。
 */
import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Reasoning from './Reasoning.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const summary = snip('<span>考えています</span>');
const children = snip('<p>まず前提を確かめる</p>');
const root = (c: HTMLElement) => c.querySelector('.sc-reasoning') as HTMLElement;

it('生成中は領域が aria-busy で伝える(中身は live region にしない。洪水回避)', () => {
  const { container } = render(Reasoning, { props: { status: 'busy', summary, children } });
  expect(root(container).getAttribute('aria-busy')).toBe('true');
  const body = container.querySelector('.sc-reasoning-body') as HTMLElement;
  expect(body.getAttribute('aria-live')).toBeNull();
  expect(body.getAttribute('role')).toBeNull();
});

it('完了で aria-busy が下りる', () => {
  const { container } = render(Reasoning, { props: { status: 'complete', summary, children } });
  expect(root(container).getAttribute('aria-busy')).toBe('false');
});

it('完了が届く経路は名前(段階を語る名前を穏当な live region に置く)', () => {
  const { container } = render(Reasoning, { props: { status: 'busy', summary, children } });
  const name = container.querySelector('.sc-reasoning-name') as HTMLElement;
  expect(name.getAttribute('role')).toBe('status');
  expect(name.textContent).toBe('考えています');
  // 名前はトリガーの中にある(畳んでも見える。無名の推論を許さない)
  expect(name.closest('summary')).not.toBeNull();
});

it('既定は畳んだ状態(推論は回答ではなく補助)', () => {
  const { container } = render(Reasoning, { props: { status: 'complete', summary, children } });
  expect((container.querySelector('details') as HTMLDetailsElement).open).toBe(false);
});

it('open で中身が現れる', () => {
  const { container } = render(Reasoning, { props: { status: 'complete', summary, children, open: true } });
  expect((container.querySelector('details') as HTMLDetailsElement).open).toBe(true);
  expect(container.querySelector('.sc-reasoning-body')?.textContent).toContain('前提');
});

it('トリガーの操作は openchange を発火する(値の更新はアプリ。UI が勝手に畳まない)', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Reasoning, { props: { status: 'complete', summary, children, onopenchange } });
  await fireEvent.click(container.querySelector('summary') as HTMLElement);
  expect(onopenchange).toHaveBeenCalledWith(true);
});

it('畳む機構は Disclosure の合成(原子に AI の関心を持ち込まない)', () => {
  const { container } = render(Reasoning, { props: { status: 'busy', summary, children } });
  expect(container.querySelector('.sc-disclosure')).not.toBeNull();
});
