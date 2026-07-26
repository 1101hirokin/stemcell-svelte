/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  // 契約は props を持たない(縛るのは到達性と相互参照だけで、形も項目の中身も Expressive)。
  props: {},
} as const;

/**
 * 出典項目の最小の形。契約が縛るのは「各項目が source の持つ相互参照キーを帯びること」だけで
 * (source §3 の裁定: キーは UI が採番せず source が持つ値を使う)、題や url といった中身の最小形は
 * foundation で未決である(source §8)。ゆえにここでは id 以外を素通しにする。
 */
export type SourceItem = { id: string } & Record<string, unknown>;
