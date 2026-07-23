/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    color: { values: ['danger', 'warning', 'success', 'info'], default: 'info' },
    dismissible: { default: false },
  },
} as const;

/**
 * dismissLabel は Web 層の取り決め(DS 所有の文字列。中立契約に無い。i18n.md)。× のアクセシブルネームを
 * 「文脈(title)+ 閉じる語」に合成するための閉じる語。既定は英語、ロケールは消費者が上書き(第4条)。
 * newTabLabel / Tag.dismissLabel に続く3つ目の DS 所有文字列(集約の判断は i18n.md §4)。
 */
export const WEB = {
  dismissLabel: { default: 'Close' },
} as const;
