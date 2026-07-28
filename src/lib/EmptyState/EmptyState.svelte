<script lang="ts">
  import './EmptyState.css';
  import type { Snippet } from 'svelte';

  // ここには何も無い、という報せ(EmptyState.md)。空は正常な状態で、部品が持つのは何が無いのかを言葉に
  // することと、次にできることを置く場所だけである。失敗は扱わない(空は正常、失敗は異常)。
  // 0 件になったことの告知も持たない(部品は自分が現れたことしか知らない。patterns/empty-results.md)。
  interface Props {
    /** 何が無いのかを言う見出し。階層(h2 か h3 か)は画面の構造なので消費者が決める。 */
    heading: Snippet;
    /** 補足。次に何ができるかを文で示す。 */
    description?: Snippet;
    /** 絵(挿絵・アイコン)。装飾であり意味を運ばない。 */
    media?: Snippet;
    /** 次の一手(作る・招く・条件を戻す)。 */
    actions?: Snippet;
  }
  let { heading, description, media, actions }: Props = $props();
</script>

<!-- 意味を運ぶのは見出しと説明で、絵は装飾として支援技術から外す。部品は role を立てず、生きた領域も
     持たない(後から現れる領域の告知は拾われない。告知はアプリの常設の領域が持つ)。 -->
<div class="sc-empty-state">
  {#if media}<div class="sc-empty-state-media" aria-hidden="true">{@render media()}</div>{/if}
  <div class="sc-empty-state-text">
    <div class="sc-empty-state-heading">{@render heading()}</div>
    {#if description}<div class="sc-empty-state-description">{@render description()}</div>{/if}
  </div>
  {#if actions}<div class="sc-empty-state-actions">{@render actions()}</div>{/if}
</div>
