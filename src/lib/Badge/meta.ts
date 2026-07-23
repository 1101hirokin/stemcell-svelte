/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    count: {},
    max: { default: 99 },
    dot: { default: false },
    label: {},
    color: { values: ['danger', 'warning', 'success', 'info'], default: 'info' },
    variant: { values: ['filled', 'soft'], default: 'filled' },
  },
} as const;
