/** 既定値の単一の源。conformance が契約と照合する。 */
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
