<script lang="ts">
  import './CodeBlock.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  // コードの塊(CodeBlock.md)。値は文字列で受け取る: 持ち出すべきは着色前の文字であり、着色済みの木から
  // 拾い直すと行番号や装飾が混ざる。着色は器の仕事ではない(言語の集合が閉じない)が、色は DS が持つ
  // (color.md §10。RFC 0018)。
  interface Props {
    /** コードの文字列。器が持つ真実で、複写が渡すのもこれである。 */
    code: string;
    /** 言語の印(ts / python)。器は解釈せず、着色の器械が読む印として素通しする。 */
    language?: string;
    /** 送れる領域の名前。溢れているときこの器は焦点を受けるので、名前が要る。 */
    label: string;
    /** 行を折り返すか。既定は折らない(行が構文の単位である。typography.md §5 の例外)。 */
    wrap?: boolean;
    /** 行番号を出すか。既定は出さない(そのまま複写する使い方の邪魔になる)。 */
    lineNumbers?: boolean;
    /** 本体と線で区切られた上部。何を置くかは器が決めない(言語名・ファイル名・複写はアプリの政策)。 */
    header?: Snippet;
    /** 着色済みの中身。省略すると器が code をそのまま描く。差されても複写は code を渡す。 */
    children?: Snippet;
  }
  let {
    code,
    language,
    label,
    wrap = META.props.wrap.default,
    lineNumbers = META.props.lineNumbers.default,
    header,
    children,
  }: Props = $props();

  // 行そのものが要素になる。番号は CSS が数え、行の中身は文字のままなので複写に混ざらない。
  // 末尾の改行だけ落とすのは、split が生む空の一行を数えないためである
  const lines = $derived(code.replace(/\n$/, '').split('\n'));

  // 溢れているときだけ焦点を受ける(WCAG 2.2 SC 2.1.1)。Chrome と Firefox は溢れた領域へ自動で焦点を
  // 与えるが Safari は与えない。溢れていない塊に焦点を置くと、押せもしない場所で停留が増える
  let scroller = $state<HTMLElement>();
  let overflowing = $state(false);
  const measure = () => {
    const el = scroller;
    if (el) overflowing = el.scrollWidth - el.clientWidth > 1;
  };
  $effect(() => {
    void code;
    void wrap;
    measure();
    const el = scroller;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  });
</script>

<!-- 空白と改行は native が保つ(pre)。「ここはコードである」も native が届ける(code = ARIA の code
     ロール)。器が足すのは、送れることと、その領域の名前と、置き場所だけである(第2条)。 -->
<div class="sc-codeblock" data-wrap={wrap || undefined} data-line-numbers={lineNumbers || undefined}>
  {#if header}<div class="sc-codeblock-header">{@render header()}</div>{/if}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- 規則は素の要素を無闇に停留所にしないためのものだが、送れる領域はその例外である
       (WCAG 2.2 SC 2.1.1: ポインタでしか動かせない領域を作らない。Reel と同じ扱い)。
       溢れているときだけ立てるので、規則が防ごうとしている「中身の無い停留所」は生まれない。
       焦点を受ける以上は名前が要るので、そのときだけ領域として名乗る -->
  <div
    class="sc-codeblock-scroller"
    bind:this={scroller}
    tabindex={overflowing ? 0 : undefined}
    role={overflowing ? 'region' : undefined}
    aria-label={overflowing ? label : undefined}
  ><pre class="sc-codeblock-pre"><code
        class="sc-codeblock-code {language ? `language-${language}` : ''}"
      >{#if children}{@render children()}{:else}{#each lines as line, i (i)}<span
            class="sc-codeblock-line">{line}{i < lines.length - 1 ? '\n' : ''}</span>{/each}{/if}</code></pre></div>
</div>
