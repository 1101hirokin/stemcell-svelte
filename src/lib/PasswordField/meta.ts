/** 既定値の単一の源。conformance が契約と照合する(契約は TextField を継承する)。 */
export const META = {
  props: {
    // TextField から継承する解剖と所有
    name: {},
    value: { default: '' },
    placeholder: {},
    disabled: { default: false },
    readonly: { default: false },
    invalid: { default: false },
    required: { default: false },
    autocomplete: {},
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
    // 秘匿の欄が足すもの
    keyboard: { values: ['text'], default: 'text' },
    revealLabel: {},
    hideLabel: {},
    revealedMessage: {},
    hiddenMessage: {},
  },
} as const;
