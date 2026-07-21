/**
 * Playground のスモーク検証(再現可能な形の記録)。
 * 「実 Chromium で描画を確認した」という一過性の手動 QA 主張を、独立レビューが再実行できる
 * 検査に置き換える(WORKFLOW の証拠の規律。独立レビューの指摘への対応)。
 * 検証: (1) ライトで全部品が描画される (2) data-theme=standard-dark で地の面の色が変わる
 * (3) Switcher が狭い器(360px)で縦へ切り替わる (4) TextField のエラー文が light / dark とも
 * danger.soft-fg を実際に引いている(転用の実機確認。TextField.md §2)。
 * 前提: bun run playground:build 済み。実行: bun experiments/playground-smoke/smoke.ts
 * Chromium の場所は PW_CHROMIUM(環境変数)→ /opt/pw-browsers/chromium → playwright の
 * 既定キャッシュ、の順で解決する(リモート/ローカルの環境差)。
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const executablePath =
  process.env.PW_CHROMIUM ??
  (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : chromium.executablePath());

const PORT = 4311;
const preview = spawn('bunx', ['vite', 'preview', '--config', 'vite.playground.config.ts', '--port', String(PORT), '--strictPort'], {
  cwd: `${import.meta.dirname}/../..`,
  stdio: 'ignore',
});
try {
  // サーバの起動を待つ
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(`http://localhost:${PORT}/`);
      if (r.ok) break;
    } catch {
      if (i > 50) throw new Error('vite preview が起動しない');
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForSelector('.sc-button');

  const counts = await page.evaluate(() => ({
    button: document.querySelectorAll('.sc-button').length,
    switcher: document.querySelectorAll('.sc-switcher').length,
    box: document.querySelectorAll('.sc-box').length,
    stack: document.querySelectorAll('.sc-stack').length,
    cluster: document.querySelectorAll('.sc-cluster').length,
    textfield: document.querySelectorAll('.sc-textfield').length,
    grid: document.querySelectorAll('.sc-grid').length,
    sidebar: document.querySelectorAll('.sc-sidebar').length,
  }));
  for (const [k, v] of Object.entries(counts)) {
    if (v === 0) throw new Error(`描画されていない: ${k}`);
  }

  // TextField のエラー文が danger.soft-fg を実際に引いているか(転用の実機確認)
  const errorColor = () =>
    page.evaluate(() => {
      const el = document.querySelector('.sc-textfield-error') as HTMLElement | null;
      if (!el) return null;
      const probe = document.createElement('span');
      probe.style.color = 'var(--color-semantic-danger-soft-fg)';
      el.parentElement!.appendChild(probe);
      const r = { got: getComputedStyle(el).color, want: getComputedStyle(probe).color };
      probe.remove();
      return r;
    });
  const errLight = await errorColor();
  if (!errLight) throw new Error('TextField のエラー文が描画されていない');
  if (errLight.got !== errLight.want)
    throw new Error(`エラー文が danger.soft-fg を引いていない(light): ${JSON.stringify(errLight)}`);

  // disabled×invalid は disabled が勝つ(state.md §3.1)。CSS の後勝ちに依存するため回帰保護を置く
  // (独立レビュー major 指摘: 自動テストが無かった)
  const cascade = await page.evaluate(() => {
    const tf = document.querySelector(
      '.sc-textfield[data-disabled="true"][data-invalid="true"]',
    ) as HTMLElement | null;
    if (!tf) return null;
    const probe = (v: string) => {
      const s = document.createElement('span');
      s.style.color = `var(${v})`;
      tf.appendChild(s);
      const c = getComputedStyle(s).color;
      s.remove();
      return c;
    };
    return {
      border: getComputedStyle(tf.querySelector('.sc-textfield-control')!).borderTopColor,
      disabled: probe('--color-semantic-disabled-border'),
      danger: probe('--color-semantic-danger-border'),
    };
  });
  if (!cascade) throw new Error('disabled×invalid の TextField が playground に無い');
  if (cascade.border !== cascade.disabled || cascade.border === cascade.danger)
    throw new Error(`disabled×invalid で disabled が勝っていない: ${JSON.stringify(cascade)}`);

  const bgLight = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.selectOption('select >> nth=0', 'standard-dark');
  await page.waitForTimeout(100);
  const attr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const bgDark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  if (attr !== 'standard-dark') throw new Error(`data-theme が立たない: ${attr}`);
  if (bgLight === bgDark) throw new Error(`テーマ切替で地の面が変わらない: ${bgLight}`);
  const errDark = await errorColor();
  if (!errDark || errDark.got === errLight.got || errDark.got !== errDark.want)
    throw new Error(`エラー文が dark で danger.soft-fg に追従しない: ${JSON.stringify(errDark)}`);

  await page.selectOption('select >> nth=0', 'auto');
  await page.evaluate(() => {
    (document.querySelectorAll('.pg-resizable')[0] as HTMLElement).style.width = '360px';
  });
  await page.waitForTimeout(100);
  const rows = await page.evaluate(() => {
    const sw = document.querySelector('.sc-switcher') as HTMLElement;
    return new Set([...sw.children].map((k) => (k as HTMLElement).offsetTop)).size;
  });
  if (rows !== 3) throw new Error(`360px で縦(3行)にならない: ${rows}行`);

  // Sidebar: 狭い器で縦へ折れ、DOM 順(side=start: 脇→本体)は折れても変わらない
  const sb = await page.evaluate(() => {
    const el = document.querySelector('.sc-sidebar') as HTMLElement;
    (el.parentElement as HTMLElement).style.width = '260px';
    const [a, b] = [...el.children] as HTMLElement[];
    return {
      folded: a!.offsetTop !== b!.offsetTop,
      order: [...el.children].map((k) => k.className),
    };
  });
  if (!sb.folded) throw new Error('Sidebar が 260px で折れない');
  if (sb.order.join(',') !== 'sc-sidebar-side,sc-sidebar-content')
    throw new Error(`Sidebar の DOM 順が視覚順と食い違う: ${sb.order.join(',')}`);

  await browser.close();
  console.log(
    `smoke green: 部品描画 ${JSON.stringify(counts)} / dark 切替 ${bgLight} → ${bgDark} / 360px で縦(3行) / エラー文 = danger.soft-fg(light ${errLight.got} / dark ${errDark.got})`,
  );
} finally {
  preview.kill();
}
