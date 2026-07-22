/**
 * 被験者コードを門に掛ける(再現可能な形の記録。独立レビュー major 指摘への対応)。
 * 実行: bun experiments/agent-consumption/probe.ts <A|B|C>
 * 前提: harness/ で bun install 済み(registry が localhost:4873 に立っていること)。
 * 検査: (1) svelte-check(使用検証の門の最小形) (2) vite build (3) 実 Chromium で
 * a11y 配線(label for / inputmode / autocomplete)と、被験者の検証設計に応じた
 * invalid の発火(A: 逐次 / B: submit / C: blur)。
 */
import { chromium } from 'playwright-core';
import { spawnSync, spawn } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const subject = process.argv[2];
if (!subject || !['A', 'B', 'C'].includes(subject)) {
  console.error('usage: bun probe.ts <A|B|C>');
  process.exit(2);
}
const DIR = import.meta.dirname;
const HARNESS = join(DIR, 'harness');
const executablePath =
  process.env.PW_CHROMIUM ??
  (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : chromium.executablePath());

copyFileSync(join(DIR, `subjects/${subject}.svelte`), join(HARNESS, 'src/App.svelte'));

const run = (cmd: string[]) => spawnSync(cmd[0]!, cmd.slice(1), { cwd: HARNESS, stdio: 'pipe' });
const check = run(['bunx', 'svelte-check', '--tsconfig', './tsconfig.json']);
// main.ts からの .svelte import の宣言エラー(lang="ts" 無しの被験者で出るハーネス起因)は除外して数える
const errors = (check.output?.join('\n') ?? '')
  .split('\n')
  .filter((l) => l.includes('Error:') && !l.includes('Could not find a declaration file'));
console.log(`svelte-check: ${errors.length === 0 ? 'green' : `RED\n${errors.join('\n')}`}`);
const build = run(['bunx', 'vite', 'build']);
console.log(`vite build: ${build.status === 0 ? 'green' : 'RED'}`);
if (errors.length || build.status !== 0) process.exit(1);

const preview = spawn('bunx', ['vite', 'preview', '--port', '4319', '--strictPort'], { cwd: HARNESS, stdio: 'ignore' });
try {
  for (let i = 0; ; i++) {
    try { if ((await fetch('http://localhost:4319/')).ok) break; }
    catch { if (i > 50) throw new Error('preview 起動せず'); await new Promise((r) => setTimeout(r, 100)); }
  }
  const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:4319/');
  await page.waitForSelector('.sc-textfield');

  const wiring = await page.evaluate(() =>
    [...document.querySelectorAll('.sc-textfield')].map((tf) => {
      const input = tf.querySelector('.sc-textfield-input') as HTMLInputElement;
      const label = tf.querySelector('.sc-textfield-label') as HTMLLabelElement;
      return {
        labelFor: label.htmlFor === input.id,
        inputmode: input.getAttribute('inputmode'),
        autocomplete: input.getAttribute('autocomplete'),
      };
    }),
  );
  console.log('a11y 配線:', JSON.stringify(wiring));

  const email = page.locator('.sc-textfield-input').nth(1);
  await email.fill('foo');
  if (subject === 'B') await page.locator('.sc-button').first().click();
  if (subject === 'C') await email.blur();
  await page.waitForTimeout(50);
  const invalid = await page.evaluate(() => {
    const input = [...document.querySelectorAll('.sc-textfield-input')][1] as HTMLInputElement;
    const err = document.querySelector('.sc-textfield-error');
    return {
      ariaInvalid: input.getAttribute('aria-invalid'),
      errorShown: !!err,
      describedbyOk: err ? (input.getAttribute('aria-describedby') ?? '').includes(err.id) : false,
    };
  });
  console.log(`invalid の発火(${subject} の検証設計に応じた操作後):`, JSON.stringify(invalid));
  await browser.close();
  const ok = invalid.ariaInvalid === 'true' && invalid.errorShown && invalid.describedbyOk;
  console.log(ok ? 'probe green' : 'probe RED');
  process.exit(ok ? 0 : 1);
} finally {
  preview.kill();
}
