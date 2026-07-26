/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    items: {}, // {label,href?}[] を上位から順に。最後が現在地
  },
} as const;

export type Crumb = { label: string; href?: string };
