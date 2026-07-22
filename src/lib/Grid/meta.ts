/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    min: { values: ['8rem', '12rem', '16rem', '20rem', '24rem', '32rem'], default: '16rem' },
    gap: { default: 'md' },
  },
} as const;
