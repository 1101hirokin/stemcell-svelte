/**
 * 触点の鍵盤が出ている間、打っている欄を見えているところへ置く。
 *
 * 環境は焦点の乗った欄を鍵盤の上まで運ぶ。ただし運べるのは送り代が残っているときだけである。欄が
 * ページの終わり近くにあると送り代が足りず、欄は鍵盤の下に残る(実機で確認。svelte の HOLES #135。
 * 同じ欄でも、下に余白のある画面では運ばれた)。
 *
 * iOS ではこれを機構で解けない。鍵盤が出ても版面(layout viewport)は縮まないので、送り代は増えない。
 * `interactive-widget=resizes-content` は Chromium だけが持ち、WebKit は持たない。
 *
 * そこで二段で受ける。足りない送り代を、送る器の終わりへ一時的に足し、そのうえで、見えている領域から
 * 欄がはみ出している分だけ送る。環境が自分で運べた場面では差が 0 なので何も起きない(奪い合わない)。
 * 足した余地は、鍵盤が引っ込んだときと後始末で戻す。
 */
import { OVERLAY_EDGE, visibleArea } from './overlay-position';

export function keepAboveKeyboard(el: HTMLElement): () => void {
  const vv = typeof window === 'undefined' ? undefined : window.visualViewport;
  if (!vv) return () => {};
  let id = 0;
  let pending = false;
  let added = 0; // 足した余地(px)

  const scroller = () => (document.scrollingElement ?? document.documentElement) as HTMLElement | null;
  const restore = () => {
    if (!added) return;
    added = 0;
    const doc = scroller();
    if (doc) doc.style.paddingBlockEnd = '';
  };

  const settle = () => {
    pending = false;
    const room = visibleArea();
    const r = el.getBoundingClientRect();
    const below = r.bottom - (room.top + room.height - OVERLAY_EDGE);
    const above = room.top + OVERLAY_EDGE - r.top;
    if (below > 1) {
      const doc = scroller();
      if (doc) {
        // 残っている送り代。足りない分だけ器の終わりへ余地を足す
        const left = doc.scrollHeight - doc.clientHeight - doc.scrollTop;
        if (left < below) {
          added += below - left;
          doc.style.paddingBlockEnd = `${added}px`;
        }
      }
      window.scrollBy({ top: below });
    } else if (above > 1) {
      // 欄が見えている領域より上にある(鍵盤が高い、拡大している)
      window.scrollBy({ top: -above });
    } else if (added && vv.height >= document.documentElement.clientHeight) {
      restore(); // 鍵盤が引っ込んだ
    }
  };

  const schedule = () => {
    if (pending) return;
    pending = true;
    id = requestAnimationFrame(settle);
  };

  schedule(); // 鍵盤が既に出ている状態で焦点が乗った場合
  vv.addEventListener('resize', schedule);
  return () => {
    if (pending) cancelAnimationFrame(id);
    vv.removeEventListener('resize', schedule);
    restore();
  };
}
