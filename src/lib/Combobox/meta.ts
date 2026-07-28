/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    name: {},
    value: { default: '' }, // 選ばれている選択肢の識別子。打った文字はここに入らない
    options: {}, // いま出す候補。絞り込みは部品が持たない(消費者が渡し直す)
    inputValue: {},
    placeholder: {},
    disabled: { default: false },
    readonly: { default: false },
    invalid: { default: false },
    required: { default: false },
    labelHidden: { default: false },
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
    emptyLabel: {},
    countLabel: {},
  },
} as const;

export type ComboboxOption = {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  disabled?: boolean;
};
