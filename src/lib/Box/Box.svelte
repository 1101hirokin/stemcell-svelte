<script lang="ts">
  import './Box.css';
  import { isTier, isGlobalPrimitive, warnSpacing } from '../internal/spacing';
  import type { Snippet } from 'svelte';

  interface Props {
    /** 内側余白。spacing の語彙: 段(sm / md / lg)または大域の原始 X(8〜24)。省略時は余白なし。 */
    inset?: string;
    /**
     * 逃げ道(契約外 = Svelte の土地の声)。layout.md §6: Box のみ最高自由度を持ち、
     * as 多相(意味的要素へ)と自由 style を許す唯一の逃げ道。素の div の直接使用は非推奨で、
     * 素の器が欲しいケースはここに集約する。トークン値の使用を推奨(自由な指定は最終手段)。
     */
    as?: keyof HTMLElementTagNameMap;
    style?: string;
    class?: string;
    children: Snippet;
  }
  let { inset, as = 'div', style, class: klass, children }: Props = $props();

  const tier = $derived(inset !== undefined && isTier(inset));
  const primitive = $derived(inset !== undefined && !tier && isGlobalPrimitive(inset));
  $effect(() => {
    if (inset !== undefined && !tier && !primitive) warnSpacing('Box', 'inset', inset, '余白なし');
  });
</script>

<!-- 見た目と意味を持たない器(契約 a11y)。意味が要るときは as で意味的要素になる。 -->
<svelte:element
  this={as}
  class={klass ? `sc-box ${klass}` : 'sc-box'}
  {style}
  data-inset={tier ? inset : undefined}
  style:padding={primitive ? `var(--spacing-${inset})` : undefined}
>
  {@render children()}
</svelte:element>
