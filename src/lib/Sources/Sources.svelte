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

  // 描く行。相互参照キー(id)は UI が採番せず source が持つ値を使う(source §3 の裁定)ので、
  // 無いものや重なったものは「結べない項目」として素通しする(発明しない)。
  // 反復のキーは行ごとに一意でなければならないため、結べない項目は位置で並べる。
  // DOM の id は最初の1件にだけ置く: 同じ id が2つあると断片リンク(#id)がどちらを指すか決まらず、
  // HTML としても不正になる。
  const rows = $derived.by(() => {
    const seen = new Set<string>();
    return items.map((item, index) => {
      const id = item?.id;
      const anchored = !!id && !seen.has(id);
      if (id) seen.add(id);
      return { item, key: anchored ? id : index, anchor: anchored ? id : undefined };
    });
  });

  // 結べない項目があれば知らせる(採番してしまうと、本文側の端と食い違う偽の対応ができる)。
  $effect(() => {
    if (items.some((item) => !item?.id)) {
      console.warn(
        '[stemcell] Sources: 相互参照キー(id)を持たない出典があります。本文中の引用と結べません(source §3。キーは UI が採番せず source が持つ値を使う)。',
      );
    }
    const ids = items.map((item) => item?.id).filter(Boolean);
    if (new Set(ids).size !== ids.length) {
      console.warn(
        '[stemcell] Sources: 同じ相互参照キー(id)の出典が複数あります。本文中の引用がどれを指すか決まらないので、2件目以降は結べません(source §3)。',
      );
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
    {#each rows as row (row.key)}
      <!-- 各項目は source の id を帯びる。本文中の引用の印は同じ id を指し、両端とも採番しない。
           DOM の id にそのまま載せるのは、断片リンク(#id)という最も確実に届く到達手段を開けるため。
           結べない項目(id が無い / 同じ id の2件目以降)は位置で並べる。逐次配信の途中や、同じ出典を
           何度も引く回答でキーが衝突し、一覧ごと落ちるのを避ける。警告は出す。 -->
      <li class="sc-sources-item" id={row.anchor}>{@render children(row.item)}</li>
    {/each}
  </ul>
{/if}
