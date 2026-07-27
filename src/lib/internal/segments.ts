/**
 * 桁を持つ欄の共通部分(DateField / TimeField)。日付と時刻は値の意味が違うが、桁の手触りは同じである:
 * 上下で増減して端で回り、数字を打つと右から詰めて溜まり、桁が埋まると次へ送る。
 *
 * ここに置くのは、その手触りを決める純粋な計算だけである。焦点の移動と値の公開は、値の意味を知っている
 * 各部品が持つ(日付は「実在する日か」を、時刻は「HH:mm」を知っている)。
 */

export type Bounds = { min: number; max: number };

/** 桁の表示。未入力は下敷き(YYYY / MM)を出す。 */
export const showSegment = (n: number | undefined, width: number, placeholder: string): string =>
  n == null ? placeholder : String(n).padStart(width, '0');

/**
 * 上下の増減。端で回る(12月の次は1月)。未入力から動かすときの起点は呼び手が渡す
 * (年は今年から、月と日と時刻は下限から)。
 */
export const stepSegment = (
  current: number | undefined,
  delta: number,
  bounds: Bounds,
  fallback: number,
): number => {
  const from = current ?? fallback;
  const next = from + delta;
  if (next > bounds.max) return bounds.min;
  if (next < bounds.min) return bounds.max;
  return next;
};

/**
 * 打たれた数字を1つ受ける。溜めた文字は桁の幅で切り、上下限へ収める。
 * `advance` は「この桁は埋まったので次へ送ってよい」を意味する: 幅いっぱいまで打たれたか、
 * これ以上打つと上限を超える(3 を打った月に次の数字は入らない)ときに立つ。
 */
export const takeDigit = (
  typed: string,
  digit: string,
  width: number,
  bounds: Bounds,
): { typed: string; value: number; advance: boolean } => {
  const buffer = (typed + digit).slice(-width);
  const raw = Number(buffer);
  const value = Math.min(Math.max(raw, 0) || bounds.min, bounds.max);
  return { typed: buffer, value, advance: buffer.length >= width || raw * 10 > bounds.max };
};
