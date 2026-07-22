/**
 * Switcher threshold の実測(layout.md §9 の裁定材料 + 純 CSS 実装の検証 = 実装 Done の条件)。
 *
 * 問い:
 *   1. flex-basis 算術は契約の意味論(器の幅が threshold 未満で縦・以上で横)を正確に実装するか。
 *   2. threshold の単位(px / rem)は文字拡大(ブラウザのフォント設定 = root font-size 変更)で
 *      どう振る舞うか。「同じ幅なら同じ形」の「幅」の定義が割れる点を数値で観測する。
 *
 * 方法: 実装そのものの CSS(Switcher.css)と tokens のビルド出力を実 Chromium に読み込み、
 * Switcher が描画する DOM と同一のマークアップ(sc-switcher > sc-button x3)で器の幅を
 * 1px 刻みに走査して切替点を測る。jsdom はレイアウトを計算しないため実ブラウザを使う。
 */
import { chromium } from 'playwright-core';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const executablePath =
  process.env.PW_CHROMIUM ??
  (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : chromium.executablePath());

const TOKENS = join(import.meta.dirname, '../../node_modules/@stemcell/tokens/dist/web');
const LIB = join(import.meta.dirname, '../../src/lib');
const css = (p: string) => readFileSync(p, 'utf-8');

const PAGE = (rootPx: number, threshold: string, containerPx: number, labels: string[]) => `
<!doctype html><html><head><style>
${css(join(TOKENS, 'base.css'))}
${css(join(TOKENS, 'standard-light.css'))}
${css(join(LIB, 'Button/Button.css'))}
${css(join(LIB, 'Switcher/Switcher.css'))}
html { font-size: ${rootPx}px; }
body { margin: 0; }
#box { width: ${containerPx}px; }
</style></head><body>
<div id="box">
  <div class="sc-switcher" data-gap="md" style="--sc-switcher-threshold: ${threshold}">
    ${labels.map((l) => `<button class="sc-button" data-variant="filled" data-color="primary" data-size="md">${l}</button>`).join('\n    ')}
  </div>
</div>
</body></html>`;

const LABELS = ['変更を保存', 'キャンセル', 'プレビュー'];

const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
const page = await browser.newPage();

/** 器の幅 containerPx で描画し、形(horizontal / vertical / mixed)と溢れを返す。 */
async function render(rootPx: number, threshold: string, containerPx: number) {
  await page.setContent(PAGE(rootPx, threshold, containerPx, LABELS));
  return page.evaluate(() => {
    const sw = document.querySelector('.sc-switcher') as HTMLElement;
    const kids = [...sw.children] as HTMLElement[];
    const tops = new Set(kids.map((k) => k.offsetTop));
    const shape = tops.size === 1 ? 'horizontal' : tops.size === kids.length ? 'vertical' : 'mixed';
    // 溢れ: 行全体が器からはみ出す(row)か、ラベルが部品内で折り返して部品が縦に育つ(textWrap)か。
    const overflow = sw.scrollWidth > sw.clientWidth + 1;
    const heights = kids.map((k) => k.offsetHeight);
    const textWrap = Math.max(...heights) > Math.min(...heights) + 1 || Math.max(...heights) > 80;
    const gap = getComputedStyle(sw).columnGap;
    return { shape, overflow, gap, maxH: Math.max(...heights) };
  });
}

/** 切替点: shape が vertical → horizontal に変わる最小の器の幅を二分探索で求める。 */
async function switchPoint(rootPx: number, threshold: string, lo = 100, hi = 1400): Promise<number> {
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const { shape } = await render(rootPx, threshold, mid);
    if (shape === 'horizontal') hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

console.log('== 1. 機構検証: threshold=30rem, root=16px(期待: 480px 未満で縦・480px で横) ==');
for (const w of [479, 480, 481]) {
  const r = await render(16, '30rem', w);
  console.log(`  幅 ${w}px: ${r.shape}(gap=${r.gap})`);
}
console.log(`  切替点(実測): ${await switchPoint(16, '30rem')}px`);

console.log('== 2. 単位×文字拡大: 切替点(px)の移動 ==');
for (const rootPx of [16, 20, 24]) {
  const rem = await switchPoint(rootPx, '30rem');
  const px = await switchPoint(rootPx, '480px');
  console.log(`  root=${rootPx}px: 30rem → ${rem}px / 480px → ${px}px`);
}

console.log('== 3. 実害: px 閾値 + 文字拡大時、横のまま中身が溢れるか ==');
console.log('   (器 490px = px 閾値 480 の直上。root を上げると横形のまま中身だけ育つ)');
for (const rootPx of [16, 20, 24]) {
  const px = await render(rootPx, '480px', 490);
  const rem = await render(rootPx, '30rem', 490);
  const fmt = (r: Awaited<ReturnType<typeof render>>) =>
    `${r.shape}${r.overflow ? '・行が器から溢れ' : ''}(部品高 ${r.maxH}px)`;
  console.log(`  root=${rootPx}px 器490px: [480px閾値] ${fmt(px)} / [30rem閾値] ${fmt(rem)}`);
}

console.log('== 4. gap 語彙の解決 ==');
{
  await page.setContent(PAGE(16, '30rem', 600, LABELS));
  const md = await page.evaluate(() => getComputedStyle(document.querySelector('.sc-switcher')!).columnGap);
  await page.evaluate(() => {
    const sw = document.querySelector('.sc-switcher') as HTMLElement;
    sw.removeAttribute('data-gap');
    sw.style.gap = 'var(--spacing-8)'; // 大域の原始 8 = 32px
  });
  const p8 = await page.evaluate(() => getComputedStyle(document.querySelector('.sc-switcher')!).columnGap);
  console.log(`  段 md → ${md}(期待 16px) / 原始 8 → ${p8}(期待 32px)`);
}

await browser.close();
