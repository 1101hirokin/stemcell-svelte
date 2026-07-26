<script lang="ts">
  import './Reasoning.css';
  import { META } from './meta';
  import Disclosure from '../Disclosure/Disclosure.svelte';
  import type { Snippet } from 'svelte';

  // 推論(thinking)の経過を畳める面(Reasoning.md)。何をどう考えるかには触れない。
  // 畳む機構は Disclosure が持ち、ここが足すのは生成の進行の到達性と、推論が補助であるという扱い。
  interface Props {
    /** 生成の段階。アプリが所有する値で、UI は与えられた段階を描くだけ(streaming §2)。 */
    status: (typeof META.props.status.values)[number];
    /** 中身を開いているか。アプリが所有する値(state.md §6)。既定は畳んだ状態。 */
    open?: boolean;
    /**
     * 常に見えるトリガー兼名前(必須)。段階が名前に現れることを期待する(「考えています」→
     * 「3秒考えました」)。完了が支援技術へ届く経路がこの名前である(契約 a11y)。
     */
    summary: Snippet;
    /** 推論の中身。順序づけられた segments を1つの塊として受ける(器は列の構造を主張しない)。 */
    children: Snippet;
    /** 開閉の要求。アプリが open を更新する(Disclosure と同じ結線)。 */
    onopenchange?: (open: boolean) => void;
  }
  let {
    status,
    open = META.props.open.default,
    summary: summaryContent,
    children,
    onopenchange,
  }: Props = $props();
</script>

<!-- 生成中であることは領域が aria-busy で伝える(streaming §4 / state.md §3.2 の領域)。
     中身そのものは live region にしない: 逐次のトークンを chunk ごとに読み上げると洪水になる。
     完了が届く経路は名前(summary)である。段階を語る名前を穏当な live region に置き、変わったことを
     一度だけ告げる。DS は段階の文言を持たない(持てば i18n の対象が増える。ToolCall の告知と同じ筋)。 -->
<div class="sc-reasoning" data-status={status} aria-busy={status === 'busy'}>
  <Disclosure {open} {onopenchange}>
    {#snippet summary()}
      <span class="sc-reasoning-name" role="status">{@render summaryContent()}</span>
    {/snippet}
    {#snippet content()}
      <div class="sc-reasoning-body">{@render children()}</div>
    {/snippet}
  </Disclosure>
</div>
