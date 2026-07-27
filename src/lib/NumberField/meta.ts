/** 既定値の単一の源。conformance が契約と照合する(契約は TextField を継承する)。 */
export const META = {
  props: {
    // TextField から継承する解剖と所有
    name: {},
    placeholder: {},
    disabled: { default: false },
    readonly: { default: false },
    invalid: { default: false },
    required: { default: false },
    autocomplete: {},
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
    // 数の欄が足すもの
    value: {}, // 空(未入力)は値が無いことであって 0 ではない
    min: {},
    max: {},
    step: { default: 1 },
    keyboard: { values: ['numeric', 'decimal'], default: 'numeric' },
    incrementLabel: {},
    decrementLabel: {},
  },
} as const;
