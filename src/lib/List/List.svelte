<script lang="ts" generics="T extends { id: string }">
  import './List.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  // 項目の並び(List.md)。部品が並びの構造を保証し、各項目の中身はアプリが差す。
  // 選択は持たない: 選ぶ場面は RadioGroup / Menu / Tabs が既に埋めている(第3条)。
  interface Props {
    /** 項目の列。id 以外の中身は部品が解釈しない。 */
    items: T[];
    /** 項目のあいだに区切りを引く。既定は引かない。 */
    divided?: boolean;
    /** 各項目の中身。項目を引数に受ける。 */
    children: Snippet<[T]>;
  }
  let { items, divided = META.props.divided.default, children }: Props = $props();
</script>

<!-- 項目が無ければ何も描かない(0件のリストを支援技術へ届けない。Sources と同じ線)。
     項目の外枠(li)は List が持つので、アプリが差すのは中身だけでよい。
     role=list を明示するのは、一覧の見た目のために list-style や display を触ると ul の暗黙の役割が
     落ちる環境があるため(layout.md §6 の役割の再付与)。 -->
{#if items.length > 0}
  <ul class="sc-list" role="list" data-divided={divided}>
    {#each items as item (item.id)}
      <li class="sc-list-item">{@render children(item)}</li>
    {/each}
  </ul>
{/if}
