<script lang="ts">
  import './Tabs.css';
  import { arrowKeys } from '../internal/direction';
  import { META, type TabItem } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import { tick } from 'svelte';
  import type { Snippet } from 'svelte';

  // 同じ場所に重ねた面を帯で切り替える(Tabs.md)。選ばれているタブはアプリが所有する値で、
  // UI は与えられた選択を描く(state.md §6: selected は親の選択の項目への射影であって状態ではない)。
  interface Props {
    /** 選ばれているタブの id。 */
    value: string;
    /** タブの列。データで渡す(Select の options・Menu の items と同じ理由)。 */
    items: TabItem[];
    /** 選ばれているタブの中身。id を受ける(パネルの中身は任意なのでデータに載らない)。 */
    panel: Snippet<[string]>;
    /** 選択の要求。アプリが value を更新する。 */
    onchange?: (value: string) => void;
  }
  let { value = $bindable(), items, panel, onchange }: Props = $props();

  const uid = $props.id();
  const tabId = (id: string) => `${uid}-tab-${id}`;
  const panelId = (id: string) => `${uid}-panel-${id}`;

  let listEl: HTMLElement | undefined = $state();

  const select = (id: string) => {
    value = id;
    onchange?.(id);
  };

  // 矢印での移動は選択を伴う(移動 = 選択。web-keys.rules.json の arrows.tabs)。disabled は飛ばす。
  const step = async (from: string, delta: number) => {
    const enabled = items.filter((item) => !item.disabled);
    if (enabled.length === 0) return;
    const index = enabled.findIndex((item) => item.id === from);
    const next = enabled[(index + delta + enabled.length) % enabled.length]!;
    select(next.id);
    // 焦点も動かす。アプリが選択を拒んだときは value が変わらないので、焦点も動かない
    await tick();
    listEl?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
  };

  const onkeydown = async (e: KeyboardEvent, id: string) => {
    // 論理方向(RTL では左右の意味が反転する。internal/direction.ts が :dir() で解く)
    const { forward, backward } = arrowKeys(listEl);
    const enabled = items.filter((item) => !item.disabled);
    if (e.key === forward) await step(id, 1);
    else if (e.key === backward) await step(id, -1);
    else if (e.key === 'Home' && enabled[0]) await step(enabled[0].id, 0);
    else if (e.key === 'End' && enabled.at(-1)) await step(enabled.at(-1)!.id, 0);
    else return;
    e.preventDefault();
  };
</script>

<!-- 帯は tablist、各タブは tab、中身は tabpanel。契約の role は活性化される側(tab)に立つ(Tabs.md §2)。
     焦点は帯の中で1つだけ Tab 順に載る(roving tabindex)。示していないパネルは描かないので、
     支援技術からも到達しない(Disclosure の畳んだ中身と同じ線)。 -->
<div class="sc-tabs">
  <div class="sc-tabs-list" role="tablist" bind:this={listEl}>
    {#each items as item (item.id)}
      <button
        class="sc-tabs-tab"
        type="button"
        role="tab"
        id={tabId(item.id)}
        aria-selected={item.id === value}
        aria-controls={panelId(item.id)}
        tabindex={item.id === value ? 0 : -1}
        disabled={item.disabled}
        onclick={() => select(item.id)}
        onkeydown={(e) => onkeydown(e, item.id)}
      >
        {#if item.icon}<Icon name={item.icon} />{/if}
        <span>{item.label}</span>
      </button>
    {/each}
  </div>

  <!-- パネルは焦点を受ける。帯から中身の領域へ辿り着く経路になる(APG Tabs Pattern) -->
  <div class="sc-tabs-panel" role="tabpanel" id={panelId(value)} aria-labelledby={tabId(value)} tabindex="0">
    {@render panel(value)}
  </div>
</div>
