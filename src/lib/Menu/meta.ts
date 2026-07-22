/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    items: {}, // {id,label,icon?,description?,disabled?}[] をデータで渡す
    disabled: { default: false },
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
    placement: { values: ['block-end', 'block-start'], default: 'block-end' },
  },
} as const;
