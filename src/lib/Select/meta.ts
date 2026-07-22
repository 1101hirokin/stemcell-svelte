/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    value: { default: '' },
    options: {}, // {value,label,icon?,description?,disabled?}[] をデータで渡す
    placeholder: {}, // 任意。未選択時の表示
    disabled: { default: false },
    invalid: { default: false },
    required: { default: false },
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
  },
} as const;
