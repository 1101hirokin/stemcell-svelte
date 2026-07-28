/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    name: {},
    value: { default: '' },
    options: {}, // {value,label,icon?,description?,disabled?}[] をデータで渡す
    placeholder: {}, // 任意。未選択時の表示
    disabled: { default: false },
    invalid: { default: false },
    required: { default: false },
    labelHidden: { default: false }, // 名前を視覚から隠す(field.md §2 の prop。Pagination の中央が最初の消費者)
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
  },
} as const;
