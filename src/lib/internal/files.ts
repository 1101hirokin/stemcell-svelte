/**
 * 受け入れる種類の判定(FileField.md §2)。MIME 型の列で言い、総称(image/*)と、Web の方言である
 * 拡張子(.csv)を解く。環境の選択画面は accept で勝手に絞ってくれるが、落とすのと貼るのは素通しなので、
 * 同じ絞り込みをここで当てる(同じ欄が経路によって違うものを受け取らないため)。
 *
 * 中身が本当にその型かは確かめない(拡張子を変えただけのファイルは通る)。それはアプリの仕事である。
 */
export type AcceptList = readonly string[] | undefined;

const matchesOne = (file: File, rule: string): boolean => {
  const r = rule.trim().toLowerCase();
  if (!r) return false;
  if (r === '*/*' || r === '*') return true;
  if (r.startsWith('.')) return file.name.toLowerCase().endsWith(r); // Web の方言
  const type = (file.type || '').toLowerCase();
  if (r.endsWith('/*')) return type.startsWith(r.slice(0, -1));
  return type === r;
};

/** accept が明示されていないときは何でも通す。 */
export const matchesAccept = (file: File, accept: AcceptList): boolean =>
  !accept || accept.length === 0 || accept.some((rule) => matchesOne(file, rule));

/** 受け取るものと弾くものへ分ける。 */
export const splitByAccept = (
  files: readonly File[],
  accept: AcceptList,
): { accepted: File[]; rejected: File[] } => {
  const accepted: File[] = [];
  const rejected: File[] = [];
  for (const f of files) (matchesAccept(f, accept) ? accepted : rejected).push(f);
  return { accepted, rejected };
};

/** 落とされた・貼られたものからファイルだけを取り出す。 */
export const filesFrom = (data: DataTransfer | null | undefined): File[] =>
  data ? Array.from(data.files ?? []) : [];
