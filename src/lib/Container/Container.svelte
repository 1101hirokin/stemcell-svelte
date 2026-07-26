<script lang="ts">
  import './Container.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  // ページ幅の制約(Container.md)。app shell の外殻が持つ最大幅であり、本文の測度(Center)とは別物。
  // prose を持たないのは、ページの殻に測度は無関係だからである(持たせれば Center との線が溶ける)。
  interface Props {
    /** 幅の上限。container の段。 */
    max?: (typeof META.props.max.values)[number];
    children: Snippet;
  }
  let { max = META.props.max.default, children }: Props = $props();
</script>

<!-- 見た目と意味を持たない器(契約 a11y): states 無し・focus 無し・構造の主張無し。
     左右の最低余白(gutter)は持たない。Box(inset)との合成が既定(Container.md §3)。 -->
<div class="sc-container" data-max={max}>
  {@render children()}
</div>
