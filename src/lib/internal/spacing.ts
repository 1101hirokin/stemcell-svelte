/**
 * 間隔 prop の値域(layout.md §6)。段(sm / md / lg)と大域の原始 X(8〜24)の混合型で、
 * 契約スキーマの enum では表現できないため、値の照合は実装側の仕事(同 §6)。
 * プリミティブ(Box / Stack / Cluster / Switcher …)が共有する。
 */
export const SPACING_TIERS = ['sm', 'md', 'lg'] as const;
export type SpacingTier = (typeof SPACING_TIERS)[number];

export const isTier = (v: string): v is SpacingTier =>
  (SPACING_TIERS as readonly string[]).includes(v);

/** 大域の原始 X(8〜24 の整数の文字列)か。小域(0〜7)と生の px は受けない(spacing.md §6)。 */
export const isGlobalPrimitive = (v: string): boolean => /^(8|9|1[0-9]|2[0-4])$/.test(v);

/** 語彙外の値の共通の警告(退避先は呼び出し側が示す)。 */
export const warnSpacing = (component: string, prop: string, value: string, fallback: string) => {
  console.warn(
    `[stemcell] ${component}: ${prop}="${value}" は spacing の語彙(sm/md/lg または 8〜24)ではない。${fallback}へ退避する(layout.md §6)。`,
  );
};
