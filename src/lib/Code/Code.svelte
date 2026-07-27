<script lang="ts">
  import './Code.css';
  import type { Snippet } from 'svelte';

  // 文中のコード(Code.md)。塊(CodeBlock)と別部品なのは必要とするものが違うからで、あちらは横送り・
  // 焦点・ヘッダー・行番号を持ち、こちらはどれも持たない。単色にするのは、一語か二語の断片で字句を
  // 分けて塗る意味が無く、行の中で色が散るほうが読みにくいためである。
  interface Props {
    /** コードの断片。器は解釈しない。 */
    children: Snippet;
  }
  let { children }: Props = $props();
</script>

<!-- 「ここはコードである」を native が届ける(code 要素 = ARIA の code ロール)。等幅と薄い面だけで
     伝えると、読み上げでは地の文と区別が付かない(第2条: 標準が無償で与えるものを再発明しない)。 -->
<code class="sc-code">{@render children()}</code>
