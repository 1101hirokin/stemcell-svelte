import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Conversation from './Conversation.svelte';

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const base = {
  label: snip('アシスタントとの会話'),
  resumeLabel: '新しい発話へ',
  children: snip('<p>やあ</p>'),
};
const log = (c: HTMLElement) => c.querySelector('[role="log"]') as HTMLElement;

it('記録として届き、名前を持つ(log は名前を要求する)', () => {
  const { container } = render(Conversation, { props: base });
  const el = log(container);
  expect(el).not.toBeNull();
  const named = container.querySelector(`#${el.getAttribute('aria-labelledby')}`);
  expect(named?.textContent).toContain('アシスタントとの会話');
});

// 逐次のトークンを chunk ごとに読み上げない(streaming.md §4)。生成中は告知を抑える
it('生成中は告知を抑え、終われば戻る', async () => {
  const { container, rerender } = render(Conversation, { props: { ...base, busy: true } });
  expect(log(container).getAttribute('aria-busy')).toBe('true');
  await rerender({ ...base, busy: false });
  expect(log(container).getAttribute('aria-busy')).toBeNull();
});

it('末尾から離れると知らせ、戻る手段が出る', async () => {
  const onfollowingchange = vi.fn();
  const { container } = render(Conversation, { props: { ...base, onfollowingchange } });
  const scroller = container.querySelector('.sc-conversation-scroller') as HTMLElement;
  // jsdom は寸法を持たないので、離れた状態を作って知らせる
  Object.defineProperty(scroller, 'scrollHeight', { value: 1000, configurable: true });
  Object.defineProperty(scroller, 'clientHeight', { value: 300, configurable: true });
  scroller.scrollTop = 0;
  await fireEvent.scroll(scroller);
  expect(onfollowingchange).toHaveBeenLastCalledWith(false);
});

it('末尾を追うかを消費者が持てる(その間は器が知らせない)', async () => {
  const onfollowingchange = vi.fn();
  const { container } = render(Conversation, { props: { ...base, following: true, onfollowingchange } });
  const scroller = container.querySelector('.sc-conversation-scroller') as HTMLElement;
  Object.defineProperty(scroller, 'scrollHeight', { value: 1000, configurable: true });
  Object.defineProperty(scroller, 'clientHeight', { value: 300, configurable: true });
  scroller.scrollTop = 0;
  await fireEvent.scroll(scroller);
  expect(onfollowingchange).not.toHaveBeenCalled();
});
