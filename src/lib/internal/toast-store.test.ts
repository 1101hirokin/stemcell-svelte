/** 通知ストアのライフサイクル(RFC 0013): enqueue / 自律退去 / action は退去しない / 上限 / pause。 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { toast, toasts, dismiss, setConfig, pause, resume } from './toast-store.svelte';

// exitMs は --motion-exit-duration を読むが jsdom では空 → 200ms フォールバック。
const EXIT = 200;

beforeEach(() => {
  toasts.splice(0, toasts.length);
  setConfig({ defaultDuration: 5000, max: 3 });
  vi.useFakeTimers();
});
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

it('enqueue: message と既定(color=info・dismissible=true)でキューに載る', () => {
  const id = toast('保存しました');
  expect(toasts.length).toBe(1);
  expect(toasts[0]!.id).toBe(id);
  expect(toasts[0]!.message).toBe('保存しました');
  expect(toasts[0]!.color).toBe('info');
  expect(toasts[0]!.dismissible).toBe(true);
});

it('intent ショートカット: toast.success/danger が color を載せる', () => {
  toast.success('完了');
  toast.danger('失敗');
  expect(toasts[0]!.color).toBe('success');
  expect(toasts[1]!.color).toBe('danger');
});

it('自律退去: duration 経過で leaving → exit 後にキューから外れる(SC 2.2.1)', () => {
  toast('こんにちは', { duration: 1000 });
  expect(toasts.length).toBe(1);
  vi.advanceTimersByTime(1000);
  expect(toasts[0]!.leaving).toBe(true); // exit アニメ中はまだ在る
  vi.advanceTimersByTime(EXIT);
  expect(toasts.length).toBe(0);
});

it('action あり: 自律退去しない(duration=null。第1条)', () => {
  toast('削除しました', { actionLabel: 'Undo' });
  expect(toasts[0]!.duration).toBeNull();
  vi.advanceTimersByTime(60_000);
  expect(toasts.length).toBe(1); // 時間では消えない
});

it('pause/resume: hover 中はタイマーが止まる', () => {
  toast('やあ', { duration: 1000 });
  vi.advanceTimersByTime(600);
  pause();
  vi.advanceTimersByTime(10_000); // 停止中は進まない
  expect(toasts[0]!.leaving).toBeFalsy();
  resume();
  vi.advanceTimersByTime(400); // 残り 400ms
  expect(toasts[0]!.leaving).toBe(true);
});

it('上限: max を超えると古いものから退去する', () => {
  setConfig({ max: 2 });
  toast('1');
  toast('2');
  toast('3');
  // 3つ目で最古(1)が退去へ。leaving を除いた live は 2 に収まる。
  const live = toasts.filter((t) => !t.leaving);
  expect(live.length).toBe(2);
  expect(live.map((t) => t.message)).toEqual(['2', '3']);
});

it('dismiss: onDismiss を一度だけ呼び、二重 dismiss で再発火しない', () => {
  const onDismiss = vi.fn();
  const id = toast('また', { onDismiss });
  dismiss(id);
  dismiss(id);
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

it('onDismiss が throw しても除去は走り、例外は系へ伝播しない(ゴースト化しない)', () => {
  const err = vi.spyOn(console, 'error').mockImplementation(() => {});
  const id = toast('危険', {
    onDismiss: () => {
      throw new Error('boom');
    },
  });
  expect(() => dismiss(id)).not.toThrow();
  vi.advanceTimersByTime(EXIT);
  expect(toasts.length).toBe(0); // leaving のまま残らない
  expect(err).toHaveBeenCalled();
  err.mockRestore();
});

it('setConfig: NaN / 負の max は無視して既定を保つ(上限が壊れない)', () => {
  setConfig({ max: NaN });
  setConfig({ max: -3 });
  toast('a');
  toast('b');
  toast('c');
  toast('d');
  // 既定 max=3 のまま。live は 3 に収まる(NaN/負で無効化されていない)。
  expect(toasts.filter((t) => !t.leaving).length).toBe(3);
});
