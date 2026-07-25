/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    value: {},
    name: {},
    min: { default: 0 },
    max: { default: 100 },
    step: { default: 1 },
    disabled: { default: false },
  },
} as const;
