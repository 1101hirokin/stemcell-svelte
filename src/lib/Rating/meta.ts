/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    value: {},
    max: { default: 5 },
    readonly: { default: false },
    disabled: { default: false },
    required: { default: false },
    invalid: { default: false },
    name: {},
    allowClear: { default: false },
    labelHidden: { default: false }, // 名前を視覚から隠す(field.md §2 の口。商品カードが消費者)
    valueLabel: {}, // 読み取りのときの名前(「5 段階中 4.2」)
    itemLabels: {}, // 入力のときの各段の名前
  },
} as const;
