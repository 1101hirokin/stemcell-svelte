<script lang="ts">
  import './Breadcrumb.css';
  import { type Crumb } from './meta';
  import Link from '../Link/Link.svelte';
  import type { Snippet } from 'svelte';

  // 上位からの道筋と、その終点(Breadcrumb.md)。順序そのものが意味を運ぶ。
  interface Props {
    /** 上位から順に並べた道筋。最後の1つが現在地。 */
    items: Crumb[];
    /** この領域の名前(「現在地」等)。DS は既定の文言を持たない(i18n.md §4)。 */
    label?: Snippet;
  }
  let { items, label }: Props = $props();

  const uid = $props.id();
  const labelId = `${uid}-label`;
</script>

<!-- 道案内の領域(nav ランドマーク)。中は順序のある列で、順序が道筋の意味を運ぶ。
     最後は現在地なのでリンクにしない(今いる場所は行き先ではない)。区切りは装飾として隠す。 -->
<nav class="sc-breadcrumb" aria-labelledby={label ? labelId : undefined}>
  {#if label}
    <span class="sc-breadcrumb-label" id={labelId}>{@render label()}</span>
  {/if}
  <ol class="sc-breadcrumb-trail">
    {#each items as crumb, index (crumb.label)}
      {@const last = index === items.length - 1}
      <li class="sc-breadcrumb-crumb">
        {#if last}
          <span aria-current="page">{crumb.label}</span>
        {:else if crumb.href}
          <Link href={crumb.href}>{crumb.label}</Link>
        {:else}
          <span>{crumb.label}</span>
        {/if}
        {#if !last}<span class="sc-breadcrumb-separator" aria-hidden="true">/</span>{/if}
      </li>
    {/each}
  </ol>
</nav>
