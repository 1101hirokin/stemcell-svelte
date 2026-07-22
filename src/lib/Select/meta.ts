/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    value: { default: '' },
    options: {}, // {value,label,disabled?}[] をデータで渡す(裁定: native select は文字列 label のみ)
    placeholder: {}, // 任意。未選択時の表示(無効化された先頭 option)
    disabled: { default: false },
    invalid: { default: false },
    required: { default: false },
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
  },
} as const;
