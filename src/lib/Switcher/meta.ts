/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    threshold: { default: '30rem' },
    gap: { default: 'md' },
  },
} as const;

/**
 * threshold が rem の長さか。単位は rem と裁定済み(2026-07。契約 alpha.1・layout.md §9):
 * 「同じ幅」は本文相対で定義する。rem 以外の単位と生の px は受けない。
 * 構文で裁く理由: 長さでない文字列は calc() を計算値時点で無効にし、flex-basis が auto へ
 * 縮退して閾値機構(Normative)が無警告で消えるため(HOLES #10)。
 * 値語彙(許す数値の集合)は未確定で、ここでは裁かない(Grid の min と共有)。
 */
export const isRemLength = (v: string): boolean => /^\d*\.?\d+rem$/.test(v.trim());
