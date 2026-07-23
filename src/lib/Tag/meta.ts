/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    variant: { values: ['soft', 'outlined'], default: 'soft' },
    size: { values: ['sm', 'md'], default: 'md' },
    dismissible: { default: false },
    selected: {},
    disabled: { default: false },
  },
} as const;

/**
 * dismissLabel は Web 層の取り決め(DS 所有の文字列。中立契約に無い。i18n.md)。× のアクセシブルネームを
 * 「{ラベル} {削除語}」に合成するための削除語(aria-labelledby で本体ラベルへ連ねる)。既定は英語の汎用
 * フォールバックで、ロケールは消費者が上書きする(第4条)。newTabLabel に続く2つ目の DS 所有文字列。
 */
export const WEB = {
  dismissLabel: { default: 'Remove' },
} as const;
