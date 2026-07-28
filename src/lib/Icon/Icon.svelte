<script lang="ts">
  import './Icon.css';
  // viewBox / Glyph 型は map-free の ./meta から取る(全マップを引き込まずツリーシェイクを守る。
  // icons alpha.3 で分離。独立レビュー M2)。直書きの重複を避け、SSOT を icons に一元化する。
  import { viewBox, type Glyph } from '@stemcell/icons/meta';

  // 語彙を絵で示す部品(iconography.md)。色は currentColor、寸法は 1em。
  // 二つの受け取り先(iconography.md §6): name(中立契約。文字列。全束が入る)/ glyph(Web 方言。静的に
  // 取ってツリーシェイク。`import glyph from '@stemcell/icons/arrow.down'` して渡す)。
  interface Props {
    /** セットの意味名(中立契約。iconography.md §3)。全グリフが束に入る。 */
    name?: string;
    /** 静的に取ったグリフ(Web 方言。ツリーシェイク。iconography.md §6)。name より優先。 */
    glyph?: Glyph;
    /** 意味を運ぶときの名前。省略時は装飾で支援技術から隠れる(iconography.md §5)。 */
    label?: string;
  }
  let { name, glyph, label }: Props = $props();

  // glyph 渡しは同期で描く($derived。SSR でも出る)。name の解決だけは動的 import で分離し
  // (glyph だけの消費者に全マップを混入させない。HOLES #30)、その分だけ非同期に埋める。
  let named = $state<Glyph | undefined>(undefined);
  $effect(() => {
    if (glyph || !name) {
      named = undefined;
      return;
    }
    let live = true;
    import('./resolve').then(({ resolveByName }) => {
      if (!live) return;
      named = resolveByName(name);
      if (!named) console.warn(`[stemcell] Icon: 未知の name "${name}"(セットに無い。iconography.md §3)`);
    });
    return () => { live = false; };
  });
  const resolved = $derived(glyph ?? named);
</script>

{#if resolved}
  <svg
    class="sc-icon"
    {viewBox}
    width="1em"
    height="1em"
    fill="currentColor"
    data-mirror={resolved.mirrorInRTL ? 'true' : undefined}
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : 'true'}
  >
    <path d={resolved.path} fill-rule={resolved.fillRule} />
  </svg>
{/if}
