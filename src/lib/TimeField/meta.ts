/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    name: {},
    value: { default: '' }, // HH:mm(秒を出すときは HH:mm:ss)。常に 24 時間の表記
    min: {},
    max: {},
    hourCycle: { values: ['auto', '12', '24'], default: 'auto' },
    seconds: { default: false },
    disabled: { default: false },
    readonly: { default: false },
    invalid: { default: false },
    required: { default: false },
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
  },
} as const;

export type TimeSegment = 'hour' | 'minute' | 'second' | 'dayPeriod';
