/**
 * 既定値の単一の源。conformance が契約と照合する。
 * Radio は checked / change / invalid を持たない(field.rules.json groupItems。値・change は
 * グループが所有し、error はグループに帰属する)。value は識別子で既定を持たない。
 */
export const META = {
  props: {
    value: {},
    disabled: { default: false },
  },
} as const;
