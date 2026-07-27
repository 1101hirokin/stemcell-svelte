/**
 * 行の向き(論理方向)の解決。web-keys.rules.json の共通則「RTL では Left / Right の意味が反転する」を、
 * 矢印キーを扱う部品が同じ形で引くための一箇所(Tabs / Calendar / DateField が同じ判定を写していた)。
 *
 * 判定は :dir() 擬似クラスに委ねる(第2条)。算出値の direction を読む形は、要素のスタイル再計算を
 * 起こすうえ、dir="auto" のように「中身から向きが決まる」場合を拾えない。:dir() は解決後の向きに当たる。
 */
export type ArrowKeys = { forward: 'ArrowLeft' | 'ArrowRight'; backward: 'ArrowLeft' | 'ArrowRight' };

export const arrowKeys = (el: Element | undefined | null): ArrowKeys => {
  const rtl = !!el?.matches(':dir(rtl)');
  return rtl
    ? { forward: 'ArrowLeft', backward: 'ArrowRight' }
    : { forward: 'ArrowRight', backward: 'ArrowLeft' };
};
