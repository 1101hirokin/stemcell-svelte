/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    href: {},
    external: { default: false },
  },
} as const;

/**
 * newTabLabel は Web 層の取り決めであり中立契約に無い(Link.md §2)。native アプリ(SwiftUI Link /
 * Compose)は新文脈への遷移を OS が支援技術へ告知するが、Web には相当の無償機構が無いので視覚的に隠した
 * 文字で自前に告知する。既定は英語の汎用フォールバックで、ロケールは消費者が上書きする(第4条: 逃げ道)。
 */
export const WEB = {
  newTabLabel: { default: '(opens in new tab)' },
} as const;
