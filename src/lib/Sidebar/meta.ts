/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    side: { values: ['start', 'end'], default: 'start' },
    sideWidth: { values: ['8rem', '12rem', '16rem', '20rem', '24rem', '32rem'] },
    contentMin: { default: '50%' },
    gap: { default: 'md' },
  },
} as const;
