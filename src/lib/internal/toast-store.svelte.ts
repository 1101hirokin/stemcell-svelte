/**
 * 通知(Toast)の共有ストア。キュー・タイマー・自律退去のライフサイクルを所有する(RFC 0013)。
 *
 * modal-stack.ts と同じく成分横断の module スコープ状態で、client でのみ変異する: toast() は
 * ブラウザのイベント(保存後・エラー時)から呼ばれる。SSR ではキューは空のまま — 状態を populate
 * するのは client のイベントだけで、server は toast() を呼ばない(呼んでも window ガードで no-op)。
 * ゆえに跨リクエスト漏洩しない(modal-stack と同じ安全性の輪郭)。
 *
 * Svelte の StemcellProvider は DOM を出さない自己完結の副作用で(StemcellProvider.md §8)、子孫を
 * 包まないため tree context を配れない。ゆえに「文脈のルートがホストを提供する」(RFC 0013)の Svelte
 * での表現は、この client スコープの module ストアである(Compose の hoist した SnackbarHostState、
 * SwiftUI の environment に対応する各プラットフォームの環境機構)。RFC 0013 は naive な公開 global を
 * 退けたが、その懸念は SSR で populate される状態の漏洩であり、client 専用の一時キューはそれに当たらない。
 * ここは実装が仕様へ投げ返す論点として上流へ還流する。
 */

export type ToastColor = 'danger' | 'warning' | 'success' | 'info';

export interface ToastOptions {
  /** 報告の intent(color.md §5)。既定 info。 */
  color?: ToastColor;
  /** 自律退去までの時間(ms)。省略時はホストの既定。actionLabel があれば無視され自律退去しない。 */
  duration?: number;
  /** 明示的に閉じられるか。既定 true。 */
  dismissible?: boolean;
  /** 単一アクションのラベル。与えると自律退去しない(第1条)。 */
  actionLabel?: string;
  /** アクション活性化時のハンドラ。 */
  onAction?: () => void;
  /** 退去時(自律・明示・アクション後いずれでも)のハンドラ。 */
  onDismiss?: () => void;
}

export interface ToastItem {
  id: string;
  message: string;
  color: ToastColor;
  dismissible: boolean;
  /** 解決済みの自律退去時間(ms)。null = 自律退去しない(actionLabel あり)。 */
  duration: number | null;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  /** 退去アニメ中(CSS の exit を起動し、motion.exit 経過後にキューから外す)。 */
  leaving?: boolean;
}

/** 表示中の通知。Toaster が {#each} で描く(参照は安定、$state が変異を追う)。 */
export const toasts = $state<ToastItem[]>([]);

/** ホスト(Toaster)が設定する。enqueue が解決に使う。 */
const config = $state({ defaultDuration: 5000, max: 3 });

let seq = 0;

/** 自律退去タイマー。pause/resume で残り時間を保つ(SC 2.2.1)。 */
interface Timer {
  remaining: number;
  startedAt: number;
  handle: ReturnType<typeof setTimeout> | null;
}
const timers = new Map<string, Timer>();

function startTimer(id: string, ms: number): void {
  const t: Timer = { remaining: ms, startedAt: Date.now(), handle: null };
  t.handle = setTimeout(() => dismiss(id), ms);
  timers.set(id, t);
}

/** hover/focus で全タイマーを一時停止する(SC 2.2.1)。 */
export function pause(): void {
  for (const t of timers.values()) {
    if (t.handle) {
      clearTimeout(t.handle);
      t.handle = null;
      t.remaining -= Date.now() - t.startedAt;
    }
  }
}

/** hover/focus を離れたら残り時間で再開する。停止中に時間切れになっていたものは即退去へ。 */
export function resume(): void {
  // dismiss が iterate 中の timers を変異させるのでスナップショットで回す。
  for (const [id, t] of [...timers]) {
    if (t.handle) continue;
    if (t.remaining <= 0) {
      dismiss(id); // 停止解除 = 時間切れの確定(取りこぼして残り続けるのを防ぐ)
      continue;
    }
    t.startedAt = Date.now();
    const remaining = t.remaining;
    t.handle = setTimeout(() => dismiss(id), remaining);
  }
}

/** 通知を積む。id を返す。SSR では no-op(client 専用)。 */
export function enqueue(message: string, opts: ToastOptions = {}): string {
  if (typeof window === 'undefined') return '';
  const id = `sc-toast-${++seq}`;
  const hasAction = !!opts.actionLabel;
  const item: ToastItem = {
    id,
    message,
    color: opts.color ?? 'info',
    dismissible: opts.dismissible ?? true,
    // actionLabel があれば自律退去しない(第1条: 消える前にアクションへ届く)。RFC 0013 / Toast 契約。
    duration: hasAction ? null : (opts.duration ?? config.defaultDuration),
    actionLabel: opts.actionLabel,
    onAction: opts.onAction,
    onDismiss: opts.onDismiss,
  };
  toasts.push(item);
  // 上限超過は古いものから退去(第1条/第3条: 画面を埋めない)。退去中(leaving)は数えない。
  let live = toasts.filter((t) => !t.leaving);
  while (live.length > config.max) {
    dismiss(live[0]!.id);
    live = toasts.filter((t) => !t.leaving);
  }
  if (item.duration != null) startTimer(id, item.duration);
  return id;
}

/**
 * 通知の退去を要求する。ホストが所有する退去(自律・明示・アクション後)。leaving を立てて CSS の exit
 * アニメを起動し、そのアニメが終わったら finishDismiss で実際にキューから外す。
 * onDismiss は要求時に一度だけ呼ぶ。
 */
export function dismiss(id: string): void {
  const item = toasts.find((t) => t.id === id);
  if (!item || item.leaving) return;
  item.leaving = true;
  const t = timers.get(id);
  if (t?.handle) clearTimeout(t.handle);
  timers.delete(id);
  // 実際にキューから外すのは、退去アニメが終わったと Toast が知らせたとき(finishDismiss)。
  // 時間を JS で計算して待つ形は持たない(CSS と JS が同じ値を二重に持つ)。
  try {
    item.onDismiss?.();
  } catch (e) {
    console.error('[stemcell] toast onDismiss threw', e);
  }
}

/** 退去アニメが終わった。Toast(要素)が知らせる。 */
export function finishDismiss(id: string): void {
  remove(id);
}

function remove(id: string): void {
  const i = toasts.findIndex((t) => t.id === id);
  if (i >= 0) toasts.splice(i, 1);
}

/** Toaster がキュー上限と既定時間を設定する。異常値(NaN・負)は無視して既定を保つ(上限が丸ごと無効化
    されたり負数で while が暴れるのを防ぐ)。 */
export function setConfig(next: Partial<{ defaultDuration: number; max: number }>): void {
  if (next.defaultDuration != null && Number.isFinite(next.defaultDuration) && next.defaultDuration >= 0) {
    config.defaultDuration = next.defaultDuration;
  }
  if (next.max != null && Number.isFinite(next.max) && next.max >= 1) {
    config.max = Math.floor(next.max);
  }
}

/**
 * ホスト(Toaster)の登録。既定ホスト(provider が body へ立てる)と app が置いたホストの調整に使う。
 * app が置いた非既定ホストがあればそれが active、無ければ既定ホストが active。active だけが描画する
 * (二重描画を避ける。RFC 0013 の「既定+差し替え可」)。
 */
const registry = $state<{ id: string; isDefault: boolean }[]>([]);

export function registerToaster(id: string, isDefault: boolean): void {
  // client 専用(enqueue と同じ防御線)。SSR では registry を触らない: 既定ホストは provider の
  // client 副作用でしか mount されず、SSR 中の登録調整は不要で、ストリーミング SSR での跨リクエスト
  // 混入も避ける(module docstring の無漏洩主張を registry にも成立させる)。
  if (typeof window === 'undefined') return;
  registry.push({ id, isDefault });
}

export function unregisterToaster(id: string): void {
  if (typeof window === 'undefined') return;
  const i = registry.findIndex((r) => r.id === id);
  if (i >= 0) registry.splice(i, 1);
}

export function isActiveToaster(id: string): boolean {
  const active = registry.find((r) => !r.isDefault) ?? registry[0];
  return active?.id === id;
}

/** 公開 API。toast(message, opts) と intent 別ショートカット。 */
export interface ToastApi {
  (message: string, opts?: ToastOptions): string;
  info(message: string, opts?: Omit<ToastOptions, 'color'>): string;
  success(message: string, opts?: Omit<ToastOptions, 'color'>): string;
  warning(message: string, opts?: Omit<ToastOptions, 'color'>): string;
  danger(message: string, opts?: Omit<ToastOptions, 'color'>): string;
  dismiss(id: string): void;
}

export const toast: ToastApi = Object.assign(
  (message: string, opts?: ToastOptions) => enqueue(message, opts),
  {
    info: (message: string, opts?: Omit<ToastOptions, 'color'>) => enqueue(message, { ...opts, color: 'info' }),
    success: (message: string, opts?: Omit<ToastOptions, 'color'>) => enqueue(message, { ...opts, color: 'success' }),
    warning: (message: string, opts?: Omit<ToastOptions, 'color'>) => enqueue(message, { ...opts, color: 'warning' }),
    danger: (message: string, opts?: Omit<ToastOptions, 'color'>) => enqueue(message, { ...opts, color: 'danger' }),
    dismiss,
  },
);
