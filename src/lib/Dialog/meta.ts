/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    open: { default: false },
    dismiss: { values: ['light', 'explicit'], default: 'light' },
  },
} as const;
