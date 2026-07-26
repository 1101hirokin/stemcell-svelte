/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    month: {}, // 表示している月(YYYY-MM)。既定を持たない
    months: { default: 1 },
    start: {},
    end: {},
    min: {},
    max: {},
    unavailable: { default: [] as string[] },
  },
} as const;
