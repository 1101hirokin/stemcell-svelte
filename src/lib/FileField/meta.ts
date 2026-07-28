/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    name: {},
    value: {},
    accept: {},
    multiple: { default: false },
    capture: { values: ['user', 'environment'] },
    directory: { default: false },
    disabled: { default: false },
    invalid: { default: false },
    required: { default: false },
    labelHidden: { default: false },
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
    triggerLabel: {},
    receivedLabel: {},
    rejectedLabel: {},
  },
} as const;
