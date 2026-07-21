/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    variant: { values: ['filled', 'soft', 'outlined', 'text'], default: 'filled' },
    color: { values: ['primary', 'danger', 'warning', 'plain'], default: 'primary' },
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
    disabled: { default: false },
    block: { default: false },
  },
} as const;
