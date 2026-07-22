/**
 * spacing の域を超える長さ prop(Switcher threshold / Grid min / Sidebar sideWidth)の検査。
 * 単位は rem: threshold は裁定済み(2026-07。契約 alpha.1)、min / sideWidth も仕様が
 * 単位 rem を記録した(2026-07。Grid / Sidebar 契約 alpha.1。container の rem 判断と
 * threshold 裁定の適用)。値語彙(数値集合)は未確定のため裁かない(layout.md §9)。
 * 構文で裁く理由: 長さでない文字列は宣言や算術を無効にし、機構(Normative)が無警告で
 * 消えるため(HOLES #10 / #20)。
 */
export const isRemLength = (v: string): boolean => /^\d*\.?\d+rem$/.test(v.trim());

/**
 * Grid min / Sidebar sideWidth の閉じた段(裁定 2026-07。契約 alpha.2。layout.md §9)。
 * 自由 rem を許さず6段に絞る(第3条の抑制。段の集合は seed で実測で調整しうる)。
 */
export const WIDTH_TIERS = ['8rem', '12rem', '16rem', '20rem', '24rem', '32rem'] as const;
export type WidthTier = (typeof WIDTH_TIERS)[number];
export const isWidthTier = (v: string): v is WidthTier =>
  (WIDTH_TIERS as readonly string[]).includes(v.trim());

/** 百分率(0〜100)の文字列か。Sidebar contentMin 用。 */
export const isPercentage = (v: string): boolean => {
  const m = /^(\d*\.?\d+)%$/.exec(v.trim());
  return m !== null && Number(m[1]) <= 100;
};
