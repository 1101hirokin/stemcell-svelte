/**
 * 触点の鍵盤が出ている間、打っている欄を見えているところへ置く。
 *
 * 環境は焦点の乗った欄を鍵盤の上まで運ぶ。ただし、その運びは面(top-layer)を開いた欄では働かない
 * ことがある(実機で見つけた。svelte の HOLES #135)。運ばれなければ、欄も、欄に付く候補の面も
 * 鍵盤の下に残る。
 *
 * ここで足すのは受け皿である。見えている領域から欄がはみ出しているときだけ、はみ出した分を送る。
 * 環境が自分で運んだ後は差が無いので、何も起きない(奪い合わない)。
 */
import { OVERLAY_EDGE, visibleArea } from './overlay-position';

export function keepAboveKeyboard(el: HTMLElement): () => void {
  const vv = typeof window === 'undefined' ? undefined : window.visualViewport;
  if (!vv) return () => {};
  let id = 0;
  let pending = false;
  const settle = () => {
    pending = false;
    const room = visibleArea();
    const r = el.getBoundingClientRect();
    const below = r.bottom - (room.top + room.height - OVERLAY_EDGE);
    const above = room.top + OVERLAY_EDGE - r.top;
    // 下へはみ出しているなら送る。上へはみ出しているとき(欄より鍵盤が高い場合)は上端へ寄せる
    const delta = below > 1 ? below : above > 1 ? -above : 0;
    if (delta) window.scrollBy({ top: delta });
  };
  const schedule = () => {
    if (pending) return;
    pending = true;
    id = requestAnimationFrame(settle);
  };
  schedule(); // 鍵盤が既に出ている状態で開いた場合
  vv.addEventListener('resize', schedule);
  return () => {
    if (pending) cancelAnimationFrame(id);
    vv.removeEventListener('resize', schedule);
  };
}
