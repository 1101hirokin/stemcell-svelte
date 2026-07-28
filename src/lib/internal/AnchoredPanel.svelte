<script lang="ts">
  import Popover from '../Popover/Popover.svelte';
  import Drawer from '../Drawer/Drawer.svelte';
  import { watchCompact } from './viewport';
  import type { Snippet } from 'svelte';

  // トリガーに従属する面を、画面の広さで類を変えて出す(RFC 0017 / overlay.md §5)。
  // 広い画面では popover 類(アンカー従属)、狭い画面では modal 類(下端のシート)。類が変われば modal の
  // 規範(背後を封じる・焦点を閉じ込める・Escape で閉じる)がそのまま効く。
  // DatePicker と DateRangePicker が同じ形を写していたので、ここへ寄せた。
  interface Props {
    /** 開いているか。所有者(束ねる部品)が持つ値。 */
    open?: boolean;
    /** 狭い画面でシートの見出しになる名前(modal は無名を許さない)。 */
    title: Snippet;
    /** トリガー。広い画面ではアンカーになる。 */
    trigger: Snippet;
    /** 面の中身。 */
    content: Snippet;
  }
  let { open = $bindable(false), title, trigger, content }: Props = $props();

  // 判定は環境の広さだけで、利用者の好みや消費者の裁量では動かない(閾値は breakpoint の原始から採る)
  let compact = $state(false);
  $effect(() => watchCompact((v) => (compact = v)));
</script>

{#if compact}
  {@render trigger()}
  <Drawer bind:open side="block-end" onopenchange={(o) => (open = o)} {title}>
    {#snippet content()}{@render content()}{/snippet}
  </Drawer>
{:else}
  <Popover bind:open>
    {#snippet anchor()}{@render trigger()}{/snippet}
    {#snippet content()}{@render content()}{/snippet}
  </Popover>
{/if}
