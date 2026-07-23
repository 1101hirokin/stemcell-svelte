/**
 * 開いている modal(Dialog / Drawer)の重なりを成分横断で追跡する共有スタック。
 * native の <dialog>::backdrop は枚数ぶん積算するので、最上位以外に data-under を付けて ::backdrop を
 * 透過にし、見える scrim を一段に保つ(単一 scrim。RFC 0009 / overlay.md §8)。Dialog と Drawer は
 * 同じ modal 類なので、両者が重なっても一段相当になるよう、スタックを1つに共有する。
 */
const modalStack: HTMLDialogElement[] = [];

function restack() {
  modalStack.forEach((el, i) => el.toggleAttribute('data-under', i < modalStack.length - 1));
}

/** modal を最上位として積む(showModal 済みの要素を渡す)。 */
export function pushModal(el: HTMLDialogElement) {
  if (!modalStack.includes(el)) modalStack.push(el);
  restack();
}

/** modal を重なりから外す(close / 破棄時)。 */
export function removeModal(el: HTMLDialogElement | undefined) {
  if (!el) return;
  const i = modalStack.indexOf(el);
  if (i >= 0) modalStack.splice(i, 1);
  el.removeAttribute('data-under');
  restack();
}
