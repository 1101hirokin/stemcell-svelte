/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    columns: {}, // {id, align?, sortable?}[]
    rows: {}, // {id}[] を渡す。id 以外の中身は部品が解釈しない(List と同じ形)
    overflow: { values: ['scroll', 'wrap'], default: 'scroll' },
    sticky: { values: ['none', 'start', 'end', 'both'], default: 'none' },
    sort: {},
    selected: {},
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
  },
} as const;

export type TableColumn = {
  id: string;
  /** セルの中身を行のどちら側へ寄せるか。桁で読む列(数量・金額・日付)は end。 */
  align?: 'start' | 'end';
  /** この列で並べ替えを要求できるか。部品は並べ替えない。 */
  sortable?: boolean;
};

export type TableSort = { column: string; direction: 'ascending' | 'descending' };
