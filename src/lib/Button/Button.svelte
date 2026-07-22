<script lang="ts">
  import './Button.css';
  import { META, WEB } from './meta';
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: (typeof META.props.variant.values)[number];
    color?: (typeof META.props.color.values)[number];
    size?: (typeof META.props.size.values)[number];
    disabled?: boolean;
    block?: boolean;
    /** フォーム参加の type。Web 層の取り決め(Button.md §6。既定 button で form 内の暗黙送信を塞ぐ。HOLES #24)。 */
    type?: (typeof WEB.type.values)[number];
    /** 契約の click。Svelte 5 の土地の声では callback prop(HOLES #4)。 */
    onclick?: () => void;
    start?: Snippet;
    end?: Snippet;
    children: Snippet;
  }
  let {
    variant = META.props.variant.default,
    color = META.props.color.default,
    size = META.props.size.default,
    disabled = META.props.disabled.default,
    block = META.props.block.default,
    type = WEB.type.default,
    onclick,
    start,
    end,
    children,
  }: Props = $props();
</script>

<!-- disabled は native 属性(契約の mirrorsNativeAttr。活性化と interaction の抑制が無償。HOLES #3) -->
<button
  class="sc-button"
  data-variant={variant}
  data-color={color}
  data-size={size}
  data-block={block}
  {type}
  {disabled}
  onclick={() => { if (!disabled) onclick?.(); }}
>
  {#if start}<span class="sc-button-start" aria-hidden="true">{@render start()}</span>{/if}
  {@render children()}
  {#if end}<span class="sc-button-end" aria-hidden="true">{@render end()}</span>{/if}
</button>
