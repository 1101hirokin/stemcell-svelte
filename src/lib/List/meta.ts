/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    items: {}, // {id}[] を渡す。id 以外の中身は部品が解釈しない(Sources と同じ形)
    divided: { default: false },
  },
} as const;
