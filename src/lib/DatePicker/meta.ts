/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    name: {},
    value: { default: '' },
    min: {},
    max: {},
    unavailable: { default: [] as string[] },
    disabled: { default: false },
    readonly: { default: false },
    invalid: { default: false },
    required: { default: false },
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
  },
} as const;
