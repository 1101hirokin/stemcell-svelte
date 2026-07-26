/**
 * 器の広さで overlay の類を変えるための判定(RFC 0017 / overlay.md §5)。
 * 狭いとみなすのは `breakpoint.medium` 未満(Material の compact 相当)である。
 *
 * 閾値の値は持たない。CSS のメディアクエリは custom property を読めない(layout.md §8)ので、
 * 算出値から取って matchMedia を組む。実装に px を直書きすると SSOT が二重になる。
 */
export function watchCompact(onchange: (compact: boolean) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-medium');
  const px = Number.parseFloat(raw);
  if (!Number.isFinite(px)) return () => {}; // トークンが届いていない環境では広い側に倒す
  // 閾値そのものは medium(広い側)なので、狭いのはその手前まで
  const query = window.matchMedia(`(max-width: ${px - 0.02}px)`);
  const notify = () => onchange(query.matches);
  notify();
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
}
