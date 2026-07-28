// Playground(WORKFLOW §2-6。裁定 2026-07: 各実装リポは実物を触って確認する場を持つ)の設定。
// テストは vitest.config.ts が別に持つ。
import { defineConfig, loadEnv } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig(({ mode }) => {
  // 待ち受けと許可ホストは .env.local から読む(私的な名前と IP を git に載せない)。
  // root が playground/ なので envDir の既定もそちらを向く。設定用の値は
  // このパッケージの直下に置きたいので、cwd を明示して読む(.env.example 参照)。
  const env = loadEnv(mode, process.cwd(), '');

  const allowedHosts = (env.PLAYGROUND_ALLOWED_HOSTS ?? '')
    .split(',')
    // URL で書かれても動くように、scheme とパスを落としてホスト名だけにする
    .map((host) => host.trim().replace(/^[a-z]+:\/\//i, '').replace(/\/.*$/, ''))
    .filter(Boolean);

  // 既定(未設定)は localhost のまま。true で全インターフェース、IP を書けばそれだけ。
  const rawHost = (env.PLAYGROUND_HOST ?? '').trim();
  const host = rawHost === '' ? undefined : rawHost === 'true' ? true : rawHost;

  // ポートを指定したときは strictPort にする。外から転送する先が黙ってずれると
  // 経路が切れるので、空いていなければ別番号へ逃げずに落ちる方がよい。
  const port = env.PLAYGROUND_PORT ? Number(env.PLAYGROUND_PORT) : undefined;

  return {
    root: 'playground',
    plugins: [svelte()],
    server: {
      // tokens は未 publish のため隣の作業コピーを読む(README)。root の外を許可する
      fs: { allow: ['..'] },
      ...(host !== undefined ? { host } : {}),
      ...(port !== undefined ? { port, strictPort: true } : {}),
      ...(allowedHosts.length > 0 ? { allowedHosts } : {}),
    },
    build: { outDir: 'dist' },
  };
});
