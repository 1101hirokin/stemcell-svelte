/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    gap: { default: 'md' },
    align: { values: ['start', 'center', 'end'], default: 'start' },
  },
} as const;
