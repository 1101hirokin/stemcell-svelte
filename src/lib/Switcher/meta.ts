/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    threshold: { default: '30rem' },
    gap: { default: 'md' },
  },
} as const;

/** 意味層の段。layout.md §6: 間隔 prop の値域は段(sm/md/lg)と大域の原始 X(8〜24)。 */
export const GAP_TIERS = ['sm', 'md', 'lg'] as const;

/** 大域の原始 X(8〜24 の整数の文字列)か。小域(0〜7)と生の px は受けない(spacing.md §6)。 */
export const isGlobalPrimitive = (v: string): boolean => /^(8|9|1[0-9]|2[0-4])$/.test(v);

/**
 * threshold が CSS の長さとして構文的に成立するか。不正な文字列は calc() を
 * 計算値時点で無効にし、flex-basis が auto へ縮退して閾値機構が無警告で消える
 * (= 契約が却下した内容駆動の折返しに戻る)ため、構文だけは検査する。
 * 値語彙(単位の裁定を含む)は未確定であり、ここでは裁かない(layout.md §9。HOLES #10)。
 */
export const isLength = (v: string): boolean =>
  /^\d*\.?\d+(px|rem|em|ch|ex|vw|vh|vmin|vmax|cm|mm|in|pt|pc|q)$/i.test(v.trim());
