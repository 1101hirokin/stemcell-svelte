/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    value: { default: '' },
    placeholder: {},
    disabled: { default: false },
    readonly: { default: false },
    invalid: { default: false },
    required: { default: false },
    autocomplete: {},
    keyboard: {
      values: ['text', 'email', 'numeric', 'decimal', 'tel', 'url'],
      default: 'text',
    },
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
  },
} as const;
