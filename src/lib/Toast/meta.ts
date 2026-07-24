/**
 * 既定値の単一の源。conformance が契約(props 名の集合と enum/既定)と照合する。
 * 注意: conformance は META と契約を突き合わせるだけで、Toast.svelte の実 Props までは見ない。
 * `duration` は通知の data だが、視覚コンポーネントの Toast.svelte はこれを持たない — 自律退去の
 * タイマーはホスト(Toaster / toast-store)が ToastOptions.duration から一元解決するため(RFC 0013:
 * ライフサイクルはホスト所有)。命令形 API の `toast(msg, { duration })` が唯一の入口。
 */
export const META = {
  props: {
    message: {},
    color: { values: ['danger', 'warning', 'success', 'info'], default: 'info' },
    duration: {},
    dismissible: { default: true },
    actionLabel: {},
  },
} as const;

/**
 * dismissLabel は Web 層の取り決め(DS 所有の文字列。中立契約に無い。i18n.md)。閉じるの
 * アクセシブルネームを「message + 閉じる語」に合成するための閉じる語。既定は英語、ロケールは
 * 消費者が上書き(第4条)。Alert.dismissLabel と同じ語彙。
 */
export const WEB = {
  dismissLabel: { default: 'Close' },
} as const;
