<script lang="ts">
  import './Reasoning.css';
  import { META } from './meta';
  import { resolveMotion } from '../internal/motion';
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
    open = $bindable(META.props.open.default),
    summary: summaryContent,
    children,
    onopenchange,
  }: Props = $props();

  let slotEl: HTMLElement | undefined = $state();
  let nameEl: HTMLElement | undefined = $state();
  // 動きの途中の影。名前が速く移り変わる配信(トークンごとに文言を書き換える等)でも、影が積み上がらない
  let leaving: Animation | undefined;

  // 名前が別の文言へ変わったら、古い文字を上へ送り、新しい文字を下から迎える(進行表現は Expressive)。
  // 名前はアプリが差すスニペットなので、いつ変わったかを prop では知れない。描かれた文字の変化を
  // そのまま合図にする(観測するだけで、値も DOM の中身も書き換えない)。
  const flip = (from: string) => {
    const slot = slotEl;
    const el = nameEl;
    if (!slot || !el || typeof el.animate !== 'function') return;
    const { duration, easing } = resolveMotion(getComputedStyle(el), 'transition');
    // reduced-motion では --motion-scale が 0 になり、ここで動かさない(部品は分岐しない。motion.md §6)
    if (duration <= 0) return;

    // 前の動きがまだ途中なら畳む(oncancel が影を片づける)。同時に二つの影を置かない
    leaving?.cancel();

    // 去る文字の影。live region の外(兄弟)に置く: 中に入れると、古い文言が支援技術へもう一度届く
    const ghost = document.createElement('span');
    ghost.className = 'sc-reasoning-name-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.textContent = from;
    slot.appendChild(ghost);

    const options = { duration, easing, fill: 'both' as const };
    const out = ghost.animate(
      [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-0.5em)' },
      ],
      options,
    );
    out.onfinish = () => ghost.remove();
    out.oncancel = () => ghost.remove();
    leaving = out;
    el.animate(
      [
        { opacity: 0, transform: 'translateY(0.5em)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      options,
    );
  };

  $effect(() => {
    const el = nameEl;
    if (!el || typeof MutationObserver === 'undefined') return;
    let previous = el.textContent ?? '';
    const observer = new MutationObserver(() => {
      const next = el.textContent ?? '';
      if (next === previous) return;
      const from = previous;
      previous = next;
      flip(from);
    });
    observer.observe(el, { characterData: true, childList: true, subtree: true });
    return () => observer.disconnect();
  });
</script>

<!-- 生成中であることは領域が aria-busy で伝える(streaming §4 / state.md §3.2 の領域)。
     中身そのものは live region にしない: 逐次のトークンを chunk ごとに読み上げると洪水になる。
     完了が届く経路は名前(summary)である。段階を語る名前を穏当な live region に置き、変わったことを
     一度だけ告げる。DS は段階の文言を持たない(持てば i18n の対象が増える。ToolCall の告知と同じ筋)。 -->
<div class="sc-reasoning" data-status={status} aria-busy={status === 'busy'}>
  <!-- 畳みの値は Disclosure と bind で繋ぐ。繋がないと、包んだ側の open が動かないまま
       bind:open を書いた消費者の値だけが取り残される(bind が効かない罠になる)。
       所有はアプリのままで、要求は onopenchange が伝える(Svelte での値の結線。HOLES #15) -->
  <Disclosure bind:open {onopenchange}>
    {#snippet summary()}
      <span class="sc-reasoning-name-slot" bind:this={slotEl}>
        <span class="sc-reasoning-name" role="status" bind:this={nameEl}>{@render summaryContent()}</span>
      </span>
    {/snippet}
    {#snippet content()}
      <div class="sc-reasoning-body">{@render children()}</div>
    {/snippet}
  </Disclosure>
</div>
