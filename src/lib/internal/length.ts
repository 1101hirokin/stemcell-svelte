/**
 * spacing の域を超える長さ prop(Switcher threshold / Grid min / Sidebar sideWidth)の検査。
 * 単位は rem: threshold はオーナー裁定済み(2026-07。記録は仕様 PR #12 の Switcher 契約
 * alpha.1 にあり、main へは未マージ。独立レビューが分岐を指摘)、min / sideWidth は同じ理由
 * (本文相対の幅)の仮置きで、値語彙(数値集合)は未確定のため裁かない(layout.md §9)。
 * 構文で裁く理由: 長さでない文字列は宣言や算術を無効にし、機構(Normative)が無警告で
 * 消えるため(HOLES #10 / #20)。
 */
export const isRemLength = (v: string): boolean => /^\d*\.?\d+rem$/.test(v.trim());

/** 百分率(0〜100)の文字列か。Sidebar contentMin 用。 */
export const isPercentage = (v: string): boolean => {
  const m = /^(\d*\.?\d+)%$/.exec(v.trim());
  return m !== null && Number(m[1]) <= 100;
};
