/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    name: {},
    checked: { default: false },
    indeterminate: { default: false },
    disabled: { default: false },
    invalid: { default: false },
    required: { default: false },
  },
} as const;
