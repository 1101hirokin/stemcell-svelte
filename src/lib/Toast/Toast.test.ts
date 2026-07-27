/** Toast の描画と a11y(role は intent 連動・Alert 同規範。アクション/閉じるの配線)。 */
import { render } from '@testing-library/svelte';
import { vi } from 'vitest';
import Toast from './Toast.svelte';

const base = { message: '保存しました' };

it('message を描き、intent の絵は装飾(aria-hidden)', () => {
  const { getByText, container } = render(Toast, { props: base });
  expect(getByText('保存しました')).toBeTruthy();
  expect(container.querySelector('.sc-toast-icon')?.getAttribute('aria-hidden')).toBe('true');
});

it('role: danger は alert(即時)、他は status(穏当)。Alert と同規範', () => {
  const info = render(Toast, { props: { ...base, color: 'info' } });
  expect(info.container.querySelector('.sc-toast')?.getAttribute('role')).toBe('status');
  const danger = render(Toast, { props: { ...base, color: 'danger' } });
  expect(danger.container.querySelector('.sc-toast')?.getAttribute('role')).toBe('alert');
});

it('dismissible 既定 true: 閉じるボタンが出て ondismiss を呼ぶ', async () => {
  const ondismiss = vi.fn();
  const { container } = render(Toast, { props: { ...base, ondismiss } });
  const close = container.querySelector('.sc-toast-dismiss') as HTMLButtonElement;
  expect(close).toBeTruthy();
  close.click();
  expect(ondismiss).toHaveBeenCalledTimes(1);
});

it('dismissible=false: 閉じるボタンを出さない', () => {
  const { container } = render(Toast, { props: { ...base, dismissible: false } });
  expect(container.querySelector('.sc-toast-dismiss')).toBeNull();
});

it('actionLabel: アクションボタンが出て、押すと onaction → ondismiss の順で呼ぶ', () => {
  const calls: string[] = [];
  const onaction = vi.fn(() => calls.push('action'));
  const ondismiss = vi.fn(() => calls.push('dismiss'));
  const { getByText } = render(Toast, { props: { ...base, actionLabel: 'Undo', onaction, ondismiss } });
  (getByText('Undo') as HTMLButtonElement).click();
  expect(calls).toEqual(['action', 'dismiss']);
});

it('閉じるのアクセシブルネームは message + 閉じる語を兄弟参照する', () => {
  const { container } = render(Toast, { props: base });
  const close = container.querySelector('.sc-toast-dismiss') as HTMLElement;
  const labelledby = close.getAttribute('aria-labelledby') ?? '';
  // message の id と閉じる語の id を指す(入れ子にせず兄弟。Alert の × と同型)
  expect(labelledby.split(' ').length).toBe(2);
  for (const id of labelledby.split(' ')) {
    expect(container.querySelector(`#${id}`)).toBeTruthy();
  }
});

// 退去の終わりは要素のアニメーションが教える(時間を JS で測らない)
it('退去アニメが終わったら知らせる。走っていなければ即座に知らせる', async () => {
  const onexitend = vi.fn();
  const { container, rerender } = render(Toast, { props: { message: 'さようなら', onexitend } });
  const el = container.querySelector('.sc-toast') as HTMLElement;
  // jsdom は Web Animations を持たないので、走っているアニメーションを差し替えて確かめる
  const finished = Promise.resolve();
  el.getAnimations = () => [{ finished } as unknown as Animation];
  await rerender({ message: 'さようなら', onexitend, leaving: true });
  await finished;
  await Promise.resolve();
  expect(onexitend).toHaveBeenCalled();
});
