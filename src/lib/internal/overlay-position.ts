/**
 * アンカー従属の面が、描画領域のどちら向きへ開くかを決める(overlay.md §5)。
 * Popover と Tooltip が同じ規則を使う(以前は各々が持っていた)。
 *
 * 上下はトリガーの居場所だけで決める。面の高さで「入るかどうか」を測る形は採らない: 中身が伸び縮み
 * するたびに向きが変わって結果が読めず、面の中を送れるようにすると溢れが消えて判定が働かなくなる。
 *
 * 左右は部品が指定した揃え(トリガーの始端 / 中心)を尊重し、それで描画領域からはみ出すときだけ、
 * トリガーが左半分なら始端を、右半分なら終端を揃える。左右は面の幅を見てよい: 揃えを変えても幅は
 * 変わらない(面は描画領域の幅で頭打ちになる)ので、上下のような堂々巡りが起きない。
 */
/**
 * いま見えている領域(px)。矩形と同じ座標系(版面の左上が原点)で返す。
 *
 * 版面(window.innerWidth / innerHeight)ではなく、見えている領域を測る。触点では鍵盤が出ると
 * 見える高さが半分近くまで減るが、版面の高さは変わらない。版面で測ると、面は「下に空きがある」と
 * 判断して鍵盤の下へ開く(欄のすぐ下に出ているのに、利用者からは何も見えない)。
 * 拡大したときも同じで、見えている領域だけが縮む。
 */
export function visibleArea(): { left: number; top: number; width: number; height: number } {
  const vv = typeof window !== 'undefined' ? window.visualViewport : undefined;
  if (!vv) return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  return { left: vv.offsetLeft, top: vv.offsetTop, width: vv.width, height: vv.height };
}

export type OverlayAlign = 'start' | 'center';
export type OverlaySides = { block: 'start' | 'end'; inline: 'start' | 'center' | 'end' };

/** 描画領域の端に触れない余白(px)。 */
export const OVERLAY_EDGE = 8;

export function resolveSides(
  anchor: { top: number; left: number; width: number; height: number },
  contentWidth: number,
  align: OverlayAlign,
): OverlaySides {
  const room = visibleArea();
  const centerX = anchor.left + anchor.width / 2;
  const block = anchor.top + anchor.height / 2 < room.top + room.height / 2 ? 'end' : 'start';
  const wantedLeft = align === 'center' ? centerX - contentWidth / 2 : anchor.left;
  const wantedFits =
    wantedLeft >= room.left + OVERLAY_EDGE &&
    wantedLeft + contentWidth <= room.left + room.width - OVERLAY_EDGE;
  const inline = wantedFits ? align : centerX < room.left + room.width / 2 ? 'start' : 'end';
  return { block, inline };
}

/**
 * 決めた向きに置いてもなお描画領域からはみ出す分を、横へ押し戻す量(px)。
 * 揃えはトリガーへの帰属を読ませるためのもので、はみ出したままでは読ませる以前に見えない。
 * 押し戻しても幅は変わらないので、向きの判定と往復しない。
 */
export function inlineShift(left: number, width: number): number {
  const room = visibleArea();
  const start = room.left + OVERLAY_EDGE;
  const end = room.left + room.width - OVERLAY_EDGE;
  if (left < start) return start - left;
  if (left + width > end) return end - (left + width);
  return 0;
}

/**
 * 選んだ向きに残っている縦の空き(px)。面がこれより高いときだけ、面は自分の中で送る。
 * 向きの判定はこの値を見ないので、頭打ちにしても判定は変わらない(以前は入るかどうかで向きを決めて
 * いたため、頭打ちが溢れを消して判定そのものを殺していた)。
 */
export function availableBlockSize(
  anchor: { top: number; height: number },
  block: 'start' | 'end',
  gap: number,
): number {
  const room = visibleArea();
  return block === 'end'
    ? room.top + room.height - (anchor.top + anchor.height) - gap - OVERLAY_EDGE
    : anchor.top - room.top - gap - OVERLAY_EDGE;
}

/** 決めた向きに合わせた fixed の位置(JS フォールバック経路。CSS Anchor Positioning 非対応時)。 */
export function resolvePosition(
  anchor: { top: number; left: number; width: number; height: number },
  content: { width: number; height: number },
  sides: OverlaySides,
  gap: number,
): { top: number; left: number } {
  const top =
    sides.block === 'end' ? anchor.top + anchor.height + gap : anchor.top - content.height - gap;
  const left =
    sides.inline === 'center'
      ? anchor.left + anchor.width / 2 - content.width / 2
      : sides.inline === 'start'
        ? anchor.left
        : anchor.left + anchor.width - content.width;
  return { top, left: left + inlineShift(left, content.width) };
}
