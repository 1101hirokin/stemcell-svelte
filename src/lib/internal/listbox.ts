/**
 * ポップアップの listbox を矢印で辿る計算(Select / Combobox)。焦点は DOM を動かさず、
 * どの選択肢に居るか(active)だけを動かす仮想焦点である(overlay.md §4)。
 *
 * ここに置くのは純粋な計算だけで、開閉と選択は各部品が持つ(選ぶ意味が違う: Select は閉じた集合から
 * 一つ、Combobox は絞り込んだ候補から一つ)。
 */

/** 選べる選択肢の位置。選べないものは飛ばす(state.md §7 の disabled)。 */
export const enabledIndexes = (options: readonly { disabled?: boolean }[]): number[] =>
  options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);

/** 一つ動かす。端では止まる(回らない。APG の listbox は端で止まる)。 */
export const nextActive = (enabled: readonly number[], active: number, dir: 1 | -1): number => {
  if (!enabled.length) return -1;
  const pos = enabled.indexOf(active);
  const nextPos = pos < 0 ? (dir > 0 ? 0 : enabled.length - 1) : pos + dir;
  const clamped = Math.min(Math.max(nextPos, 0), enabled.length - 1);
  return enabled[clamped]!;
};

/** 開いたときにどこから始めるか。選ばれているものがあればそこ、無ければ先頭。 */
export const initialActive = (
  options: readonly { disabled?: boolean }[],
  selectedIndex: number,
): number => {
  const enabled = enabledIndexes(options);
  return selectedIndex >= 0 && !options[selectedIndex]?.disabled ? selectedIndex : (enabled[0] ?? -1);
};
