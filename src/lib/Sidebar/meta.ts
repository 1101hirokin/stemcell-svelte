/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    side: { values: ['start', 'end'], default: 'start' },
    sideWidth: {},
    contentMin: { default: '50%' },
    gap: { default: 'md' },
  },
} as const;
