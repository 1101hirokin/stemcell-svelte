import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 重なりの門（layering.md §3）。
 *
 * 二つを見張る。
 *
 *   1. 内側に重なりを作る部品（素の z-index か position: sticky を自分の CSS に持つ）は、
 *      根で stacking context を閉じる（`isolation: isolate`）。閉じないと内側の数がページへ漏れ、
 *      層のトークンを引く要素と DOM の順で争う。実際に漏れた: 表の見出しの行がページの貼り付く帯を
 *      覆った（2026-07-29 実測。HOLES #144）。
 *
 *   2. 層のトークン（--layer-*-z）を引く部品は、根で閉じない。あれらは外から見える順位を持つのが
 *      仕事で、閉じたら仕事にならない。中身を預かるだけの器（レイアウトの原始、スロットに任意の
 *      中身が入る部品）も閉じない: 閉じると消費者の重なりまで閉じ込める。
 *
 * jsdom は重なりを計算しないので、宣言そのものを見張る（Popover の下限や Table の回帰と同じ形）。
 */
const LIB = join(import.meta.dirname, '..');

type Component = { name: string; css: string };

const components: Component[] = readdirSync(LIB, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== 'internal')
  .map((d) => ({ name: d.name, path: join(LIB, d.name, `${d.name}.css`) }))
  .filter((c) => existsSync(c.path))
  .map((c) => ({ name: c.name, css: readFileSync(c.path, 'utf-8') }));

/** 素の z-index（数値）か貼り付きを持つか。層のトークンを引くものは数えない。 */
const makesStacking = (css: string): boolean => /z-index:\s*[0-9]/.test(css) || /position:\s*sticky/.test(css);
const takesLayer = (css: string): boolean => /z-index:\s*var\(--layer-/.test(css);
const isolates = (css: string): boolean => /isolation:\s*isolate/.test(css);

it('部品が一つ以上見つかる（門が空振りしていない）', () => {
  expect(components.length).toBeGreaterThan(50);
});

it('内側に重なりを作る部品は、根で閉じている', () => {
  const missing = components.filter((c) => makesStacking(c.css) && !takesLayer(c.css) && !isolates(c.css));
  expect(missing.map((c) => c.name)).toEqual([]);
});

it('層のトークンを引く部品は、根で閉じていない', () => {
  const wrong = components.filter((c) => takesLayer(c.css) && isolates(c.css));
  expect(wrong.map((c) => c.name)).toEqual([]);
});
