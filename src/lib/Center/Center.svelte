<script lang="ts">
  import './Center.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  // 測度(読める幅)の中で中央に置く(Center.md)。fill 既定の唯一の明示的な例外(layout.md §2)。
  // ページの殻の幅は Container の仕事で、目的が違う(読みやすさ / 骨格)。
  interface Props {
    /** 幅の上限。container の段(rem 建てなので読者の文字拡大で一緒に広がる。layout.md §8)。 */
    max?: (typeof META.props.max.values)[number];
    children: Snippet;
  }
  let { max = META.props.max.default, children }: Props = $props();
</script>

<!-- 見た目と意味を持たない部品(契約 a11y): states 無し・focus 無し・構造の主張無し。
     中身の文字揃えは持たない(中央に置くのは箱であって文字ではない。Center.md §3)。 -->
<div class="sc-center" data-max={max}>
  {@render children()}
</div>
