<script lang="ts">
  import './StemcellProvider.css';
  import { META } from './meta';

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
    // HOLES #5: themes(カスタムテーマの色→CSS 変換)は実装保留。
    // 変換ユーティリティの置き場所が仕様側で未決(StemcellProvider.md §9: tokens 側が自然)。
    // キー検証とエスケープを各実装で再発明しない、と仕様が定めるため、ここで自作しない。
    if (themes?.length) console.warn('[stemcell] themes prop is not implemented yet (spec TODO: StemcellProvider.md §9)');
  });
</script>
