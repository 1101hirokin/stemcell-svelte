<script lang="ts">
  import './NavList.css';
  import { type NavItem } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import type { Snippet } from 'svelte';

  // 行き先の一覧と、その中の現在地(NavList.md)。画面から画面への移動の器で、
  // 同じ画面の中の切替は Tabs の仕事。
  interface Props {
    /** 行き先の列。データで渡す(Menu の items と同じ理由)。 */
    items: NavItem[];
    /** 今いる場所の id。アプリが所有する値(UI は url から推測しない)。 */
    current?: string;
    /** この領域の名前(「画面」等)。DS は既定の文言を持たない(i18n.md §4)。 */
    label?: Snippet;
  }
  let { items, current, label }: Props = $props();

  const uid = $props.id();
  const labelId = `${uid}-label`;
</script>

<!-- 道案内の領域(nav ランドマーク)。項目の器はここが持つ(アプリの作法に頼らない。Sources と同じ形)。
     現在地は aria-current で届く: 色や太さだけで示さない(WCAG 1.4.1 の同型)。これが本部品の要で、
     Link を並べるだけの合成では守られない(付け忘れても何も壊れないため)。
     行き先は native の <a href> で描く。脇の一覧の項目は行の見た目で、文中のリンクとは別物なので、
     文字のリンク(Link)を並べる形は採らない(到達性は native の a が無償で満たす)。 -->
<nav class="sc-navlist" aria-labelledby={label ? labelId : undefined}>
  {#if label}
    <span class="sc-navlist-label" id={labelId}>{@render label()}</span>
  {/if}
  <ul class="sc-navlist-items" role="list">
    {#each items as item (item.id)}
      <li>
        {#if item.disabled}
          <!-- href の無い a はもうリンクではない(Link.md §2 と同じ native の意味論)。
               焦点も受けないので、行けない行き先が Tab 順に残らない -->
          <span class="sc-navlist-item" aria-disabled="true">
            {#if item.icon}<Icon name={item.icon} />{/if}
            <span class="sc-navlist-text">{item.label}</span>
          </span>
        {:else}
          <a
            class="sc-navlist-item"
            href={item.href}
            aria-current={item.id === current ? 'page' : undefined}
          >
            {#if item.icon}<Icon name={item.icon} />{/if}
            <span class="sc-navlist-text">{item.label}</span>
          </a>
        {/if}
      </li>
    {/each}
  </ul>
</nav>
