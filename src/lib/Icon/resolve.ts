/**
 * name 文字列 → glyph の解決。全マップをここで import する。
 * Icon が静的 import せず動的 import でこれを読むことで、glyph 渡し(静的参照)だけを使う消費者の
 * バンドルに全 208 グリフが混入しない(iconography.md §6。ツリーシェイク)。name を使う消費者だけが
 * この別チャンクを読む。
 */
import { glyphs, type Glyph } from '@stemcell/icons';

export const resolveByName = (name: string): Glyph | undefined =>
  Object.hasOwn(glyphs, name) ? glyphs[name as keyof typeof glyphs] : undefined;
