/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    src: {},
    name: {},
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
    decorative: { default: false },
  },
} as const;
