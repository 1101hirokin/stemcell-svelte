/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    mimics: { values: ['text', 'box', 'circle'], default: 'text' },
  },
} as const;
