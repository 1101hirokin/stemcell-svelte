/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    position: {
      values: [
        'block-start inline-start',
        'block-start inline-center',
        'block-start inline-end',
        'block-end inline-start',
        'block-end inline-center',
        'block-end inline-end',
      ],
      default: 'block-end inline-center',
    },
    max: { default: 3 },
    defaultDuration: { default: 5000 },
  },
} as const;

/**
 * regionLabel は Web 層の取り決め(DS 所有の文字列。中立契約に無い。i18n.md)。通知領域を landmark に
 * するためのラベル(role=region + aria-label)。既定は英語、ロケールは消費者が上書き(第4条)。
 */
export const WEB = {
  regionLabel: { default: 'Notifications' },
} as const;
