/**
 * Grid min / Sidebar sideWidth の実測(layout.md §9 の値語彙の裁定材料)。
 *
 * 問い:
 *   1. auto-fit / minmax は契約の意味論(列は min を下回らない・余れば伸びる)を正確に実装するか。
 *   2. min の値は常用の部品の幅でどこまで区別に効くか(語彙を段にするなら何段が意味を持つか)。
 *   3. min が長さでないとき何が起きるか(検査が要る理由の実証)。
 *   4. rem の min は文字拡大でどう振る舞うか(threshold の rem 裁定と同じ問いの Grid 版)。
 *   5. Sidebar の折れは本体の窮屈さ(contentMin)駆動で、viewport 幅と独立か。
 *
 * 方法: 実装そのものの CSS を実 Chromium に読み込み、実装が描画するのと同一のマークアップで
 * 部品の幅を走査する。jsdom はレイアウトを計算しないため実ブラウザを使う。
 */
import { chromium } from 'playwright-core';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const executablePath =
  process.env.PW_CHROMIUM ??
  (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : chromium.executablePath());

const LIB = join(import.meta.dirname, '../../src/lib');
const css = (p: string) => readFileSync(p, 'utf-8');

const GRID_PAGE = (rootPx: number, minDecl: string, containerPx: number, items: number) => `
<!doctype html><html><head><style>
${css(join(LIB, 'Grid/Grid.css'))}
html { font-size: ${rootPx}px; }
body { margin: 0; }
#box { width: ${containerPx}px; }
.card { background: #eee; min-height: 40px; }
</style></head><body>
<div id="box">
  <div class="sc-grid" data-gap="md" style="--spacing-gap-md: 16px; ${minDecl}">
    ${Array.from({ length: items }, (_, i) => `<div class="card">${i + 1}</div>`).join('\n    ')}
  </div>
</div>
</body></html>`;

const SIDEBAR_PAGE = (containerPx: number, sideWidth: string | null, contentMin: string) => `
<!doctype html><html><head><style>
${css(join(LIB, 'Sidebar/Sidebar.css'))}
html { font-size: 16px; }
body { margin: 0; }
#box { width: ${containerPx}px; }
nav { inline-size: max-content; }
</style></head><body>
<div id="box">
  <div class="sc-sidebar" data-gap="md" style="--spacing-gap-md: 16px; ${sideWidth ? `--sc-sidebar-side-width: ${sideWidth};` : ''} --sc-sidebar-content-min: ${contentMin}">
    <div class="sc-sidebar-side"><nav>ナビゲーション項目</nav></div>
    <div class="sc-sidebar-content"><p>本体の文章</p></div>
  </div>
</div>
</body></html>`;

const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
const page = await browser.newPage();

async function gridColumns(rootPx: number, minDecl: string, containerPx: number, items = 12) {
  await page.setContent(GRID_PAGE(rootPx, minDecl, containerPx, items));
  return page.evaluate(() => {
    const g = document.querySelector('.sc-grid') as HTMLElement;
    const kids = [...g.children] as HTMLElement[];
    const firstTop = kids[0]!.offsetTop;
    const cols = kids.filter((k) => k.offsetTop === firstTop).length;
    const display = getComputedStyle(g).display;
    const overflow = g.scrollWidth > g.clientWidth + 1;
    return { cols, display, overflow, template: getComputedStyle(g).gridTemplateColumns.split(' ').length };
  });
}

async function sidebarShape(containerPx: number, sideWidth: string | null, contentMin: string) {
  await page.setContent(SIDEBAR_PAGE(containerPx, sideWidth, contentMin));
  return page.evaluate(() => {
    const sb = document.querySelector('.sc-sidebar') as HTMLElement;
    const [a, b] = [...sb.children] as HTMLElement[];
    const folded = a!.offsetTop !== b!.offsetTop;
    const sideW = (sb.querySelector('.sc-sidebar-side') as HTMLElement).offsetWidth;
    const contentW = (sb.querySelector('.sc-sidebar-content') as HTMLElement).offsetWidth;
    return { folded, sideW, contentW };
  });
}

/** 折れ点: folded → 横 に変わる最小の部品の幅を二分探索で求める。 */
async function foldPoint(sideWidth: string | null, contentMin: string, lo = 100, hi = 1600) {
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const { folded } = await sidebarShape(mid, sideWidth, contentMin);
    if (!folded) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

console.log('== 1. Grid 機構検証: min=16rem(256px), gap=16px, root=16px ==');
console.log('   期待: 列数 = floor((W + gap) / (256 + gap))。親 < min では1列が親の幅へ縮む(min(…,100%) の防波堤)');
for (const w of [200, 527, 528, 799, 800, 1071, 1072]) {
  const r = await gridColumns(16, '--sc-grid-min: 16rem', w);
  console.log(`  幅 ${w}px: ${r.cols}列${r.overflow ? '・溢れ' : ''}`);
}

console.log('== 2. min の値 × 常用の部品の幅: 列数の行列(語彙の解像度の材料) ==');
const widths = [320, 360, 600, 768, 1024, 1280, 1536];
console.log(`  部品の幅(px): ${widths.join(' / ')}`);
for (const rem of [8, 10, 12, 14, 16, 20, 24, 28, 32]) {
  const row: number[] = [];
  for (const w of widths) row.push((await gridColumns(16, `--sc-grid-min: ${rem}rem`, w)).cols);
  console.log(`  min=${String(rem).padStart(2)}rem: ${row.join(' / ')}`);
}

console.log('== 3. 実害: min が長さでないとき(検査を通さず直接注入) ==');
for (const bad of ['banana', '16', '50vw50']) {
  const r = await gridColumns(16, `--sc-grid-min: ${bad}`, 1024);
  console.log(`  min="${bad}": display=${r.display}, 列数=${r.cols}, template トラック数=${r.template}`);
}

console.log('== 4. 文字拡大(root 16/20/24px)× min=16rem, 親 1024px ==');
for (const rootPx of [16, 20, 24]) {
  const r = await gridColumns(rootPx, '--sc-grid-min: 16rem', 1024);
  console.log(`  root=${rootPx}px: ${r.cols}列(min の実効 = ${16 * rootPx}px)`);
}

console.log('== 5. Sidebar: 折れは contentMin 駆動 ==');
console.log(`  sideWidth=15rem(240px)・gap 16px。折れ点の実測:`);
for (const cm of ['30%', '50%', '70%']) {
  console.log(`  contentMin=${cm}: 折れ点 = ${await foldPoint('15rem', cm)}px`);
}
{
  const narrow = await sidebarShape(500, '15rem', '50%');
  console.log(`  親 500px(折れ域): folded=${narrow.folded}, 脇の幅=${narrow.sideW}px(全幅=行の独占)`);
  const wide = await sidebarShape(900, '15rem', '50%');
  console.log(`  親 900px(横域): folded=${wide.folded}, 脇=${wide.sideW}px / 本体=${wide.contentW}px`);
}

console.log('== 6. Sidebar: viewport からの独立(同じ部品の幅なら viewport が違っても同じ形) ==');
for (const vp of [600, 1400]) {
  await page.setViewportSize({ width: vp, height: 800 });
  const r = await sidebarShape(700, '15rem', '50%');
  console.log(`  viewport=${vp}px, 親=700px: folded=${r.folded}`);
}

await browser.close();
