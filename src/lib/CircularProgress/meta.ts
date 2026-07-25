/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    label: {},
    value: {},
    max: { default: 100 },
    showValue: { default: false },
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
  },
} as const;
