/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    threshold: { default: '30rem' },
    gap: { default: 'md' },
  },
} as const;

/** 意味層の段。layout.md §6: 間隔 prop の値域は段(sm/md/lg)と大域の原始 X(8〜24)。 */
export const GAP_TIERS = ['sm', 'md', 'lg'] as const;

/** 大域の原始 X(8〜24 の整数の文字列)か。小域(0〜7)と生の px は受けない(spacing.md §6)。 */
export const isGlobalPrimitive = (v: string): boolean => /^(8|9|1[0-9]|2[0-4])$/.test(v);
