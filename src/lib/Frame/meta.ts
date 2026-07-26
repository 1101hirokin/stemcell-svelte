/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    ratio: { default: '16/9' },
  },
} as const;

/**
 * 「横/縦」の正の整数比か。契約は比の既定集合を凍結していない(Frame.md §1 の TODO)ので
 * 数値集合は裁かず、構文だけを裁く。構文で裁く理由は Grid min / Switcher threshold と同じで、
 * 比でない文字列は aspect-ratio の宣言ごと無効にし、比の窓(Normative)が無警告で消えるため
 * (HOLES #10 / #20)。0 を含む比も枠が潰れるので受けない。
 */
export const isRatio = (v: string): boolean => {
  const m = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(v);
  return m !== null && Number(m[1]) > 0 && Number(m[2]) > 0;
};
