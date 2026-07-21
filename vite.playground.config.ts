// Playground(WORKFLOW §2-6。裁定 2026-07: 各実装リポは実物を触って確認する器を持つ)の設定。
// テストは vitest.config.ts が別に持つ。
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  root: 'playground',
  plugins: [svelte()],
  server: {
    // tokens は未 publish のため隣の作業コピーを読む(README)。root の外を許可する
    fs: { allow: ['..', '../../stemcell-tokens'] },
  },
  build: { outDir: 'dist' },
});
