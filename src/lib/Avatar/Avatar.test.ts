import { render, screen, fireEvent } from '@testing-library/svelte';
import Avatar from './Avatar.svelte';

it('器が role=img と name(アクセシブルネーム)を持ち、既定 size は md(Avatar.md §3)', () => {
  render(Avatar, { props: { name: '山田太郎' } });
  const a = screen.getByRole('img');
  expect(a.getAttribute('aria-label')).toBe('山田太郎');
  expect((a as HTMLElement).dataset.size).toBe('md');
});

it('src があれば画像を描き、名前の二重読みを避けるため画像は装飾(alt="")', () => {
  const { container } = render(Avatar, { props: { name: '田中花子', src: 'https://x.example/a.png' } });
  const img = container.querySelector('.sc-avatar-image') as HTMLImageElement;
  expect(img).not.toBeNull();
  expect(img.getAttribute('alt')).toBe('');
  expect(container.querySelector('.sc-avatar-initials')).toBeNull();
});

it('src が無ければ name のイニシャルへ退く(装飾。aria-hidden)。CJK 1語は姓の1字', () => {
  const { container } = render(Avatar, { props: { name: '山田太郎' } });
  const ini = container.querySelector('.sc-avatar-initials') as HTMLElement;
  expect(ini.getAttribute('aria-hidden')).toBe('true');
  expect(ini.textContent).toBe('山'); // 暫定規則: 非ラテン1語は先頭1字
});

it('ラテン2語は先頭語と末尾語の頭字を大文字で(暫定規則。§5 ratify 待ち)', () => {
  const { container } = render(Avatar, { props: { name: 'taro yamada' } });
  expect((container.querySelector('.sc-avatar-initials') as HTMLElement).textContent).toBe('TY');
});

it('画像の読み込みが落ちたらイニシャルへ退く(第7条。native <img> の error)', async () => {
  const { container } = render(Avatar, { props: { name: 'Ada Lovelace', src: 'https://x.example/broken.png' } });
  expect(container.querySelector('.sc-avatar-image')).not.toBeNull();
  await fireEvent.error(container.querySelector('.sc-avatar-image') as HTMLImageElement);
  expect(container.querySelector('.sc-avatar-image')).toBeNull();
  expect((container.querySelector('.sc-avatar-initials') as HTMLElement).textContent).toBe('AL');
});

it('src が別の値へ変われば失敗を畳み直して再試行する(古い失敗を引きずらない)', async () => {
  const { container, rerender } = render(Avatar, {
    props: { name: 'Ada Lovelace', src: 'https://x.example/a.png' },
  });
  await fireEvent.error(container.querySelector('.sc-avatar-image') as HTMLImageElement);
  expect(container.querySelector('.sc-avatar-image')).toBeNull(); // イニシャルへ退いた
  await rerender({ name: 'Ada Lovelace', src: 'https://x.example/b.png' });
  expect(container.querySelector('.sc-avatar-image')).not.toBeNull(); // 新しい src で再試行
});

it('size は sm / lg を data 属性で持つ', () => {
  const { container } = render(Avatar, { props: { name: 'A B', size: 'lg' } });
  expect((container.querySelector('.sc-avatar') as HTMLElement).dataset.size).toBe('lg');
});

it('decorative=true は器ごと支援技術から隠す(role/aria-label を持たず aria-hidden。§3)', () => {
  const { container } = render(Avatar, { props: { name: '山田太郎', decorative: true } });
  const a = container.querySelector('.sc-avatar') as HTMLElement;
  expect(a.getAttribute('role')).toBeNull();
  expect(a.getAttribute('aria-label')).toBeNull();
  expect(a.getAttribute('aria-hidden')).toBe('true');
  // 視覚のイニシャルは残る(退避先は不変)
  expect((container.querySelector('.sc-avatar-initials') as HTMLElement).textContent).toBe('山');
});
