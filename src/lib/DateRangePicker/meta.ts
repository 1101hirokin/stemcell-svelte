/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    name: {},
    start: { default: '' },
    end: { default: '' },
    min: {},
    max: {},
    unavailable: { default: [] as string[] },
    disabled: { default: false },
    readonly: { default: false },
    invalid: { default: false },
    required: { default: false },
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
    calendarLabel: {}, // 暦を開く操作の名前(契約 alpha.1 で slot から prop へ)
  },
} as const;
