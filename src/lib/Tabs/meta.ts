/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    value: {}, // 選ばれているタブの id。既定を持たない(黙って決めると最初の面の主張になる)
    items: {}, // {id,label,icon?,disabled?}[] をデータで渡す(Select の options と同じ形)
  },
} as const;

export type TabItem = {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
};
