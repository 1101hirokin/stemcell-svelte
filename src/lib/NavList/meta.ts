/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    items: {}, // {id,label,href,icon?,disabled?}[] をデータで渡す(Menu の items と同じ形)
    current: {}, // 今いる場所の id。任意(一覧の外の画面では省く)
  },
} as const;

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon?: string;
  disabled?: boolean;
};
