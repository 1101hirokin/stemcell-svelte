<script lang="ts">
  import './Card.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  // 地の上の面(Card.md §1)。elevation surface(面色+影)の最初の消費者。器であって意味ではない:
  // role も landmark も持たず、構造は中身が運ぶ(§3。Divider/Skeleton と同じ抑制で「カード」を連呼させない)。
  // 押せる Card は作らない(§2 裁定): 全面クリックの口を持たず、リンクの責任は中の要素が担う。
  interface Props {
    /** false(既定)は影の面、true は枠の面(影を消し border で縁取る)。variant を使わない理由は Card.md §2。 */
    outlined?: boolean;
    children: Snippet;
  }
  let { outlined = META.props.outlined.default, children }: Props = $props();
</script>

<div class="sc-card" data-outlined={outlined}>{@render children()}</div>
