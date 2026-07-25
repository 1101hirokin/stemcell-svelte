/**
 * 確定の進行(LinearProgress / CircularProgress)の値の解決。
 *
 * 契約は 0 ≤ value ≤ max と正の max を「期待する」散文の契約として書き、範囲外は呼び出し側の
 * 契約違反としたうえで、実装には clamp を求めている(aria-valuenow 相当を範囲外に出さない。
 * ARIA 上 min/max の外は不正)。max が 0 以下のときの扱いは契約に無いので、ここで決める:
 * warn して既定へ退避する。native の <progress> が不正な max を既定へ落とす挙動と、repo の
 * 既存の型(Switcher threshold / Grid min / Box inset の warn + 退避)の両方に沿う。
 */
export const DEFAULT_MAX = 100;

export interface ResolvedProgress {
  /** 0 ≤ value ≤ max に収めた値。aria-valuenow と幅の両方がこれを使う。 */
  value: number;
  /** 正の上限。不正なら既定へ退避済み。 */
  max: number;
  /** 0〜100。視覚(帯の伸び・弧の長さ)と showValue の数字が使う。 */
  percent: number;
}

export const resolveProgress = (
  component: string,
  value: number,
  max: number = DEFAULT_MAX,
): ResolvedProgress => {
  let safeMax = max;
  if (!Number.isFinite(safeMax) || safeMax <= 0) {
    console.warn(
      `[stemcell] ${component}: max には正の数を与えてください(受け取った値: ${max})。${DEFAULT_MAX} へ退避します。`,
    );
    safeMax = DEFAULT_MAX;
  }

  let safeValue = value;
  if (!Number.isFinite(safeValue)) {
    console.warn(
      `[stemcell] ${component}: value には数値を与えてください(受け取った値: ${value})。0 として扱います。`,
    );
    safeValue = 0;
  }
  // 範囲外は clamp する(契約)。呼び出し側の違反だが、支援技術へ不正な値を出さない方を優先する
  safeValue = Math.min(Math.max(safeValue, 0), safeMax);

  return { value: safeValue, max: safeMax, percent: (safeValue / safeMax) * 100 };
};
