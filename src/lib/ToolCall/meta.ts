/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    // 既定を持たない(required)。status 無しのツール活動は無意味で、黙った既定は段階の主張になる。
    status: { values: ['busy', 'result', 'error'] },
  },
} as const;
