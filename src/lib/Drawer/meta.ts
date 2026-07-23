/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    open: { default: false },
    side: {
      values: ['inline-start', 'inline-end', 'block-start', 'block-end'],
      default: 'inline-end',
    },
    dismiss: { values: ['light', 'explicit'], default: 'light' },
  },
} as const;
