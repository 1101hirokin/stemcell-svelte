export const META = {
  props: {
    theme: { values: null, default: 'auto' },
    density: { values: ['comfortable', 'compact'], default: 'comfortable' },
    themes: { values: null, default: null, optional: true },
  },
} as const;
