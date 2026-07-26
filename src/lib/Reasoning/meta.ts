/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    // 既定を持たない(required)。黙った既定は段階の主張になる(ToolCall の status と同型)。
    status: { values: ['busy', 'complete'] },
    // 既定は畳んだ状態。推論は回答ではなく補助で、既定で開くと本文より先に経過が立ちはだかる。
    open: { default: false },
  },
} as const;
