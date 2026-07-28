<script lang="ts">
  import './Accordion.css';
  import { META, type AccordionItem } from './meta';
  import Disclosure from '../Disclosure/Disclosure.svelte';
  import Icon from '../Icon/Icon.svelte';
  import type { Snippet } from 'svelte';

  // 畳んで開く項目を束ねる(Accordion.md)。各項目は Disclosure と同じ形で、開いている集合をアプリが持つ。
  // 排他の prop は持たない: 排他にしたいアプリは集合を1つに保てばよい。
  interface Props {
    /** 項目の列。データで渡す(Tabs の items と同じ理由)。 */
    items: AccordionItem[];
    /** 開いている項目の id の集合。アプリが所有する値。 */
    open?: string[];
    /** 開いている項目の中身。id を受ける。 */
    panel: Snippet<[string]>;
    /** 開閉の要求。新しい集合を渡す。 */
    onopenchange?: (open: string[]) => void;
  }
  let { items, open = $bindable(META.props.open.default), panel, onopenchange }: Props = $props();

  // 単体の開閉の要求を集合の更新へ翻訳する。ここでも値の確定はしない(アプリが open を更新する)。
  const toggle = (id: string, next: boolean) => {
    const set = next ? [...open.filter((x) => x !== id), id] : open.filter((x) => x !== id);
    open = set;
    onopenchange?.(set);
  };
</script>

<!-- 各項目は Disclosure の合成(開閉の機構・button の意味論・畳んだ中身の非到達はあちらの契約が持つ)。
     見出しのあいだを矢印で移動する語彙は持たない: 見出しはすべてが Tab 順に載る(Accordion.md §2)。 -->
<div class="sc-accordion">
  {#each items as item (item.id)}
    <div class="sc-accordion-item">
      <Disclosure
        open={open.includes(item.id)}
        disabled={item.disabled}
        onopenchange={(next) => toggle(item.id, next)}
      >
        {#snippet summary()}
          {#if item.icon}<Icon name={item.icon} />{/if}
          <span class="sc-accordion-label">{item.label}</span>
        {/snippet}
        {#snippet content()}
          {@render panel(item.id)}
        {/snippet}
      </Disclosure>
    </div>
  {/each}
</div>
