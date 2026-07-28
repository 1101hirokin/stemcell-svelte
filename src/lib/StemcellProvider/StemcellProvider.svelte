<script lang="ts">
  import './StemcellProvider.css';
  import { META } from './meta';
  import { mount, unmount } from 'svelte';
  import { defineTheme, type ThemeDefinition } from '@stemcell/tokens/theme';
  import Toaster from '../Toaster/Toaster.svelte';

  interface Props {
    theme?: string;
    density?: (typeof META.props.density.values)[number];
    /**
     * 消費者のテーマ。段は部分指定でよく、渡さなかった段は既定に落ちる。
     * 規約を満たすかは消費者の責任で、測りたいときは `stemcell-theme check` を CI で回す
     * (実行時には測らない。裁定 2026-07-28)。
     */
    themes?: ThemeDefinition[];
  }
  let {
    theme = META.props.theme.default,
    density = META.props.density.default,
    themes,
  }: Props = $props();

  // DOM を出さない。html に軸を立て、値は CSS が運ぶ(StemcellProvider.md §8)。
  // 初回属性は SSR でアプリが出す。Provider が担うのはその後の反映(同 §8)。
  $effect(() => {
    const root = document.documentElement;
    if (theme === 'auto') root.removeAttribute('data-theme'); // 属性を付けないこと自体が auto(§4)
    else root.setAttribute('data-theme', theme);
  });
  $effect(() => {
    const root = document.documentElement;
    if (density === 'comfortable') root.removeAttribute('data-density');
    else root.setAttribute('data-density', density);
  });
  $effect(() => {
    // 既定の通知ホストを body へ立てる(RFC 0013)。DOM を出さない自己完結の provider は tree context を
    // 配れないため、既定 Toaster を body へ mount する。app が <Toaster> を置けばそちらが active になり、
    // 既定は描画しない(ストアの登録調整。二重描画を避ける)。SSR では $effect は走らないので client のみ。
    const host = mount(Toaster, { target: document.body, props: { isDefault: true } });
    return () => unmount(host);
  });
  // 消費者のテーマを CSS として立てる。変換(キーの検証と値の検証)は @stemcell/tokens が持ち、
  // 各実装で再発明しない(StemcellProvider.md §7)。テーマの CSS より後に来る必要があるので、
  // head の末尾へ足す。渡さなかった段は宣言しないので、既定のまま残る
  $effect(() => {
    if (!themes?.length) return;
    const el = document.createElement('style');
    el.dataset.stemcellThemes = '';
    const dropped: string[] = [];
    el.textContent = themes
      .map((t: ThemeDefinition) => {
        const r = defineTheme(t);
        dropped.push(...r.dropped.map((d: string) => `${t.key}: ${d}`));
        return r.css;
      })
      .join('');
    document.head.append(el);
    // 落とした指定は開発中に気づけるように言う(値そのものは規約を測らない。測るのは CI の道具)
    for (const d of dropped) console.warn(`[stemcell] themes: ${d}`);
    return () => el.remove();
  });
</script>
