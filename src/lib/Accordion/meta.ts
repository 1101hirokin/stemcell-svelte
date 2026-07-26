/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    items: {}, // {id,label,icon?,disabled?}[] をデータで渡す(Tabs の items と同じ形)
    open: { default: [] as string[] }, // 開いている項目の id の集合。アプリが所有する値
  },
} as const;

export type AccordionItem = {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
};
