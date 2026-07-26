/**
 * 既定値の単一の源。conformance が契約と照合する。
 * Textarea は TextField を継承する(契約 extends)。conformance は解決後の props(TextField の
 * 全 props + rows)と照合するため、継承分もここに再宣言する。
 */
export const META = {
  props: {
    name: {},
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
    rows: { default: 3 },
    maxRows: {},
  },
} as const;
