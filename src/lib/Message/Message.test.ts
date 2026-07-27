import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Message from './Message.svelte';

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const base = { speakerLabel: 'アシスタント', children: snip('土鍋の発注点は 18個 です') };

it('発話は一つのまとまりとして届き、名前は消費者が渡した話者名になる', () => {
  const { container } = render(Message, { props: base });
  const el = container.querySelector('.sc-message') as HTMLElement;
  expect(el.getAttribute('role')).toBe('group');
  expect(el.getAttribute('aria-label')).toBe('アシスタント');
  expect(el.textContent).toContain('土鍋の発注点');
});

it('話者は conversation の閉集合から来る(器が発明しない)', () => {
  const { container } = render(Message, { props: { ...base, role: 'user', speakerLabel: 'あなた' } });
  expect((container.querySelector('.sc-message') as HTMLElement).dataset.role).toBe('user');
});

it('名乗りと補助は省ける(名前は speakerLabel が運ぶ)', () => {
  const { container } = render(Message, { props: base });
  expect(container.querySelector('.sc-message-speaker')).toBeNull();
  expect(container.querySelector('.sc-message-meta')).toBeNull();
  expect((container.querySelector('.sc-message') as HTMLElement).getAttribute('aria-label')).toBe('アシスタント');
});

it('名乗りと補助を差せば同じ器に載る', () => {
  const { container } = render(Message, {
    props: { ...base, speaker: snip('AI'), meta: snip('12:04') },
  });
  expect(container.querySelector('.sc-message-speaker')?.textContent).toContain('AI');
  expect(container.querySelector('.sc-message-meta')?.textContent).toContain('12:04');
});
