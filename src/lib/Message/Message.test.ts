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

it('話者は conversation の閉集合から来る(部品が発明しない)', () => {
  const { container } = render(Message, { props: { ...base, role: 'user', speakerLabel: 'あなた' } });
  expect((container.querySelector('.sc-message') as HTMLElement).dataset.role).toBe('user');
});

it('名乗りと補助は省ける(名前は speakerLabel が運ぶ)', () => {
  const { container } = render(Message, { props: base });
  expect(container.querySelector('.sc-message-speaker')).toBeNull();
  expect(container.querySelector('.sc-message-meta')).toBeNull();
  expect((container.querySelector('.sc-message') as HTMLElement).getAttribute('aria-label')).toBe('アシスタント');
});

it('名乗りと補助を差せば同じ部品に載る', () => {
  const { container } = render(Message, {
    props: { ...base, speaker: snip('AI'), meta: snip('12:04') },
  });
  expect(container.querySelector('.sc-message-speaker')?.textContent).toContain('AI');
  expect(container.querySelector('.sc-message-meta')?.textContent).toContain('12:04');
});

it('姿は role から導かず、渡された variant と align が出る', () => {
  const { container } = render(Message, {
    props: { ...base, role: 'user', variant: 'filled', color: 'primary', align: 'end' },
  });
  const el = container.querySelector('.sc-message') as HTMLElement;
  expect(el.dataset.variant).toBe('filled');
  expect(el.dataset.color).toBe('primary');
  expect(el.dataset.align).toBe('end');
});

it('既定の姿は話者によらず同じ(人間同士のチャットでは発話が全部 user になる)', () => {
  const { container } = render(Message, { props: { ...base, role: 'user', speakerLabel: '田中' } });
  const el = container.querySelector('.sc-message') as HTMLElement;
  expect(el.dataset.variant).toBe('soft');
  expect(el.dataset.align).toBe('start');
});
