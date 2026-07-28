<script lang="ts">
  import './Conversation.css';
  import { META } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import type { Snippet } from 'svelte';

  // 発話の並びを収める部品(Conversation.md)。会話は「新しい情報が末尾にだけ足される、意味のある順序の
  // 記録」で、この形は ARIA が log として持つ(MDN の log の例が chat logs)。feed は採らない: 各記事が
  // 焦点を受けページキーで読み飛ばす前提が、焦点を受けない発話と合わない。
  interface Props {
    /** いま発話が生成されているか。進行は状態ではなく値である(streaming.md §2)。 */
    busy?: boolean;
    /** 末尾を追っているか。省略すると部品が自分で判じる(利用者が末尾に居るあいだは追う)。
     *  渡せばそちらが勝つ(送信直後に必ず末尾へ送る等)。値はアプリが持ち、部品は followingchange で
     *  変更を要求する。要求を受けて値を戻さないと、利用者は遡れないままになる。 */
    following?: boolean;
    /** 末尾を追っているかが部品の判断で変わった。消費者が following を持っていても知らせる。 */
    onfollowingchange?: (following: boolean) => void;
    /** この記録の名前(ARIA は log に名前を要求する)。 */
    label: Snippet;
    /** 末尾へ戻る操作の名前(絵だけの操作なので文字列で足りる)。 */
    resumeLabel: string;
    /** 末尾へ戻る手段の中身を差し替える。省略すると部品が既定の手段(絵のボタン)を出す。 */
    resume?: Snippet;
    /** 並ぶもの。多くは Message だが、部品は中身を解釈しない。 */
    children: Snippet;
  }
  let {
    busy = META.props.busy.default,
    following,
    onfollowingchange,
    label,
    resumeLabel,
    resume,
    children,
  }: Props = $props();

  const uid = $props.id();
  const labelId = `${uid}-label`;

  let scroller = $state<HTMLElement>();
  let content = $state<HTMLElement>();
  // 末尾に居るか。部品が自分で判じるが、消費者が following を渡せばそちらが勝つ(送信直後に必ず追う等)
  let atBottom = $state(true);
  let unseen = $state(false);
  const followingNow = $derived(following ?? atBottom);

  const distance = () => {
    const el = scroller;
    return el ? el.scrollHeight - el.scrollTop - el.clientHeight : 0;
  };
  const toBottom = () => scroller?.scrollTo({ top: scroller.scrollHeight });

  // 部品が判じた結果は、消費者が値を持っているときも知らせる(値はアプリ所有で、部品は変更要求を出す側で
  // ある。field.md §5。知らせないと、貼り付けたままのアプリが利用者の遡りに気づけず制御を戻せない)
  const onscroll = () => {
    const next = distance() < 8;
    if (next === atBottom) return;
    atBottom = next;
    if (next) unseen = false;
    onfollowingchange?.(next);
  };

  // 新着とは末尾に足されたものを指す。末尾の要素が入れ替わったか、末尾の要素が伸びたかで判じる。
  // 上や途中への差し込み(遡って履歴を読み込む)は末尾を動かさないので新着ではない
  const tail = () => {
    const last = content?.lastElementChild as HTMLElement | null;
    return { last, size: last?.offsetHeight ?? 0 };
  };

  // 中身が伸びたときと部品が縮んだときに動く。末尾を追っているなら送り、離れているなら新着があることを
  // 覚える(読んでいる最中に画面を引きずらない。第1条)。部品の伸縮は新着ではないので覚えない
  $effect(() => {
    const box = content;
    const view = scroller;
    if (!box || !view || typeof ResizeObserver === 'undefined') return;
    let seen = tail();
    const ro = new ResizeObserver((entries) => {
      const now = tail();
      const arrived = now.last !== seen.last || now.size > seen.size;
      seen = now;
      if (followingNow) toBottom();
      else if (arrived && entries.some((entry) => entry.target === box)) unseen = true;
    });
    ro.observe(box);
    ro.observe(view);
    return () => ro.disconnect();
  });
</script>

<!-- 記録である(log)。新しい発話が順序を保って届き、名前で他の会話と区別できる。
     生成中は逐次で告知しない(aria-busy。完了で一度届く。streaming.md §4)。 -->
<div class="sc-conversation" data-busy={busy || undefined}>
  <span class="sc-conversation-label" id={labelId}>{@render label()}</span>
  <div class="sc-conversation-scroller" bind:this={scroller} {onscroll}>
    <div
      class="sc-conversation-log"
      bind:this={content}
      role="log"
      aria-labelledby={labelId}
      aria-busy={busy || undefined}
    >
      {@render children()}
    </div>
  </div>

  {#if unseen && !followingNow}
    <div class="sc-conversation-resume">
      <!-- 名前は aria-label(resumeLabel)が運び、中の絵は装飾である(iconography.md §5)。
           中身を差し替えたときは名前を二重に持たない(見えている文字が名前になる。WCAG 2.2 SC 2.5.3) -->
      <button
        type="button"
        class="sc-conversation-resume-button"
        aria-label={resume ? undefined : resumeLabel}
        onclick={() => (toBottom(), (unseen = false))}
      >
        {#if resume}{@render resume()}{:else}<Icon name="chevron.down" />{/if}
      </button>
    </div>
  {/if}
</div>
