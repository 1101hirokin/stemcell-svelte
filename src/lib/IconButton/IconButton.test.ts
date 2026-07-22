import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import IconButton from './IconButton.svelte';

const glyph = createRawSnippet(() => ({ render: () => '<svg width="1em" height="1em"></svg>' }));

it('絵1つのボタンとして描画され、既定は filled/primary/md/control', () => {
  render(IconButton, { props: { label: '削除', children: glyph } });
  const b = screen.getByRole('button');
  expect(b.dataset.variant).toBe('filled');
  expect(b.dataset.color).toBe('primary');
  expect(b.dataset.size).toBe('md');
  expect(b.dataset.shape).toBe('control');
});

it('名前は label prop が aria-label で運ぶ(可視文字が絵に置き換わったため。IconButton.md §3)', () => {
  render(IconButton, { props: { label: '削除', children: glyph } });
  // アクセシブルネームは label から来る(getByRole の name で引ける)
  expect(screen.getByRole('button', { name: '削除' })).toBeTruthy();
});

it('中の絵は装飾で、名前を二重に運ばない(glyph は aria-hidden。iconography.md §5)', () => {
  const { container } = render(IconButton, { props: { label: '削除', children: glyph } });
  const wrap = container.querySelector('.sc-iconbutton-glyph') as HTMLElement;
  expect(wrap.getAttribute('aria-hidden')).toBe('true');
});

it('shape は control/pill から選べる(shape.md §6。IconButton.md §2)', () => {
  const { container } = render(IconButton, { props: { label: 'menu', shape: 'pill', children: glyph } });
  expect((container.querySelector('.sc-iconbutton') as HTMLElement).dataset.shape).toBe('pill');
});

it('disabled のとき活性化(click)が発火しない(state.md §3.2。Button を継承)', () => {
  let fired = 0;
  render(IconButton, { props: { label: '削除', disabled: true, onclick: () => fired++, children: glyph } });
  (screen.getByRole('button') as HTMLButtonElement).click();
  expect(fired).toBe(0);
});

it('type は既定 button(form 内の暗黙送信を塞ぐ。HOLES #24。Button と同じ)', () => {
  render(IconButton, { props: { label: '削除', children: glyph } });
  expect((screen.getByRole('button') as HTMLButtonElement).type).toBe('button');
});
