<script lang="ts">
  import './StemcellProvider.css';
  import { META } from './meta';
  import { mount, unmount } from 'svelte';
  import Toaster from '../Toaster/Toaster.svelte';

  interface CustomThemeDefinition {
    key: string;
    scheme: 'light' | 'dark';
    colors: { brand: Record<'50'|'100'|'200'|'300'|'400'|'500'|'600'|'700'|'800'|'900', string> };
  }
  interface Props {
    theme?: string;
    density?: (typeof META.props.density.values)[number];
    themes?: CustomThemeDefinition[];
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
  $effect(() => {
    // HOLES #5: themes(カスタムテーマの色→CSS 変換)は実装保留。
    // 変換ユーティリティの置き場所が仕様側で未決(StemcellProvider.md §9: tokens 側が自然)。
    // キー検証とエスケープを各実装で再発明しない、と仕様が定めるため、ここで自作しない。
    if (themes?.length) console.warn('[stemcell] themes prop is not implemented yet (spec TODO: StemcellProvider.md §9)');
  });
</script>
