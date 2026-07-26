<script lang="ts">
  import './ToolCall.css';
  import { META } from './meta';
  import CircularLoader from '../CircularLoader/CircularLoader.svelte';
  import type { Snippet } from 'svelte';

  // ツール呼び出しの進行を1枚で見せる面(ToolCall.md)。ツールを実行するものではなく、
  // 与えられた段階を描くだけ(runtime とプロトコルはアプリ / SDK の領分。tool-call §6)。
  interface Props {
    /**
     * 呼び出しの段階。アプリが所有し駆動する値で、UI が内部で遷移させない(Dialog の open と同じ向き)。
     * states でなく prop なのは、これが相互作用の状態ではなく loading と同型の進行だから(tool-call §3)。
     */
    status: (typeof META.props.status.values)[number];
    /** ツールの識別。カードのアクセシブルネーム(無名のツール活動を許さない)。 */
    name: Snippet;
    /** 呼び出しの引数の表示。表示形式(整形 / 要約 / 隠す)は Expressive。 */
    input?: Snippet;
    /** 完了した結果の本体(Generative UI のレンダラが入る)。status=result のとき示す。 */
    result?: Snippet;
    /** 失敗の説明。status=error のとき示す。再試行可否の分類は持たない(畳んだ。tool-call §2)。 */
    error?: Snippet;
  }
  let { status, name, input, result, error }: Props = $props();

  const uid = $props.id();
  const nameId = `${uid}-name`;

  // 段階が支援技術へ届くことは Normative(tool-call §4)。結果や失敗の中身が無ければ、遷移は視覚だけの
  // 出来事になる(枠の色が変わるだけ)。どこからの情報かを視覚だけに頼らないという線(WCAG 1.4.1 の同型)に
  // 触れるので、実行時に開発者へ知らせる(Badge の dot × label 無しと同型で、機械では捕まえられない)。
  $effect(() => {
    if (status === 'result' && !result) {
      console.warn(
        '[stemcell] ToolCall: status="result" ですが result スロットがありません。完了が視覚だけの出来事になります(tool-call §4)。',
      );
    }
    if (status === 'error' && !error) {
      console.warn(
        '[stemcell] ToolCall: status="error" ですが error スロットがありません。失敗が視覚だけの出来事になります(tool-call §4)。',
      );
    }
  });
</script>

<!-- role=group + aria-labelledby でツール名を領域の名前にする(契約 a11y)。
     実行中は aria-busy が領域から伝え、内部の進行表示は装飾として隠す(進行表示自身が連呼しない。
     Skeleton と同型。tool-call §3)。
     告知の割り込み度は段階に連動する(tool-call §4。error は即時 = role=alert、result は穏当 = role=status)。
     live region は最初から DOM に置き、遷移で中身が入る形にする: 領域ごと後から挿入する形は
     支援技術によって拾われないことがあり、それでは「一度だけ確実に届く」を満たせない。 -->
<div class="sc-tool-call" data-status={status} role="group" aria-labelledby={nameId} aria-busy={status === 'busy'}>
  <div class="sc-tool-call-name" id={nameId}>{@render name()}</div>

  {#if input}
    <div class="sc-tool-call-input">{@render input()}</div>
  {/if}

  {#if status === 'busy'}
    <!-- 待ちの図形は円形の不確定ローダーを合成する(待ちの絵を二度描かない)。
         あの部品は本来 role=status と隠し文字で「何を待っているか」を届けるが、ここではその役を
         領域の aria-busy が持つので(契約 a11y。進行表示自身が連呼しない)、包んで支援技術から隠す。
         隠す以上ローダーの名前は誰にも届かないため空で渡す(HOLES #55) -->
    <div class="sc-tool-call-busy" aria-hidden="true">
      <CircularLoader label="" size="sm" />
    </div>
  {/if}

  <div class="sc-tool-call-result" role="status">
    {#if status === 'result' && result}{@render result()}{/if}
  </div>
  <div class="sc-tool-call-error" role="alert">
    {#if status === 'error' && error}{@render error()}{/if}
  </div>
</div>
