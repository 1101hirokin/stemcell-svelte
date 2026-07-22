/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    open: { default: false },
    placement: { values: ['block-end', 'block-start'], default: 'block-end' },
  },
} as const;
