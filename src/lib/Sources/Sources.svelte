<script lang="ts" generics="T extends SourceItem">
  import './Sources.css';
  import type { SourceItem } from './meta';
  import type { Snippet } from 'svelte';

  // 回答の根拠(出典)の集合を一枚に集める有機体(Sources.md)。何を根拠に選ぶか(検索 / RAG /
  // 引用生成)には触れない。与えられた出典を到達可能に描き、本文の引用と結ぶ器である。
  interface Props {
    /** 出典の集まりの領域名(「出典」等)。任意。名前があると何のリストかを掴める。 */
    label?: Snippet;
    /**
     * 出典の列。契約の既定スロットは「項目の列」で、それをどう受け取るか(項目ごとのスロット・
     * スニペット・配列)は各実装の表現である(契約 a11y notes)。Svelte では配列 + 項目のスニペットに
     * 写す。項目の器(li)は Sources が出すので、アプリが差すのは中身だけでよい。
     */
    items: T[];
    /** 各出典の中身。項目を引数に受ける(到達手段の Link、題や抜粋の Text を組む)。 */
    children: Snippet<[T]>;
  }
  let { label, items, children }: Props = $props();

  const uid = $props.id();
  const labelId = `${uid}-label`;

  // 相互参照キーは UI が採番せず source が持つ値を使う(source §3 の裁定)。無ければ本文中の引用と
  // 結べないので、発明せずに知らせる(採番してしまうと、本文側の端と食い違う偽の対応ができる)。
  $effect(() => {
    for (const item of items) {
      if (!item?.id) {
        console.warn(
          '[stemcell] Sources: 相互参照キー(id)を持たない出典があります。本文中の引用と結べません(source §3。キーは UI が採番せず source が持つ値を使う)。',
        );
        break;
      }
    }
  });
</script>

<!-- 出典が無ければ何も描かない(項目が0件のリストを支援技術へ届けない。契約 a11y の核心)。 -->
{#if items.length > 0}
  {#if label}
    <div class="sc-sources-label" id={labelId}>{@render label()}</div>
  {/if}
  <!-- role=list を明示する: 一覧の見た目を整えるために list-style や display を触ると、
       ul の暗黙の役割が落ちる環境がある(layout.md §6 の「役割の再付与」)。
       リストの器は Sources が持ち、項目の器(li)も Sources が出す(アプリの作法に頼らない。契約 a11y)。 -->
  <ul class="sc-sources" role="list" aria-labelledby={label ? labelId : undefined}>
    {#each items as item (item.id)}
      <!-- 各項目は source の id を帯びる。本文中の引用の印は同じ id を指し、両端とも採番しない。
           DOM の id にそのまま載せるのは、断片リンク(#id)という最も確実に届く到達手段を開けるため。 -->
      <li class="sc-sources-item" id={item.id}>{@render children(item)}</li>
    {/each}
  </ul>
{/if}
