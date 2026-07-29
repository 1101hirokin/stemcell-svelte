/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    kind: { values: ['text', 'box', 'circle'], default: 'text' },
  },
} as const;
