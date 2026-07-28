<script lang="ts">
  import './Frame.css';
  import { META, isRatio } from './meta';
  import type { Snippet } from 'svelte';

  // 比の窓(Frame.md)。中身を指定した縦横比の枠に収め、はみ出しは枠が刈る。
  // 丸い切り抜きは Avatar / shape の角の仕事で、中身の代替テキストは中身の仕事。
  interface Props {
    /** 縦横比。「横/縦」の整数比の文字列(16/9・1/1・4/3 等)。長さではなく形なのでトークンの外。 */
    ratio?: string;
    children: Snippet;
  }
  let { ratio = META.props.ratio.default, children }: Props = $props();

  const valid = $derived(isRatio(ratio));
  $effect(() => {
    if (!valid) {
      console.warn(
        `[stemcell] Frame: ratio="${ratio}" は「横/縦」の正の整数比ではない(契約)。既定の "${META.props.ratio.default}" へ退避する。`,
      );
    }
  });
</script>

<!-- 見た目と意味を持たない部品(契約 a11y): states 無し・focus 無し・構造の主張無し。 -->
<div class="sc-frame" style:--sc-frame-ratio={valid ? ratio : META.props.ratio.default}>
  {@render children()}
</div>
