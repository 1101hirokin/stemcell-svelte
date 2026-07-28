/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    fileName: {},
    meta: {},
    thumbnail: {},
    removeLabel: {},
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
  },
} as const;
