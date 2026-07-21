/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    direction: { values: ['stack', 'inline'], default: 'stack' },
    gap: { default: 'md' },
    align: { values: ['stretch', 'start', 'center', 'end'], default: 'stretch' },
  },
} as const;
