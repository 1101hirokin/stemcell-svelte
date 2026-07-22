<script lang="ts">
  import './Icon.css';
  import { glyphs, viewBox, type IconName } from '@stemcell/icons';

  // 語彙を絵で示す。それ自体は何もしない(契約)。色は currentColor(文字と同じ role)、
  // 寸法は 1em 基調(iconography.md §4)。相互作用しない・focus を受けない・states を持たない。
  interface Props {
    /** セットの意味名(iconography.md §3)。凍結までは string で受け、未知の名は warn する。 */
    name: string;
    /** 意味を運ぶときの名前。省略時は装飾で支援技術から隠れる(iconography.md §5)。 */
    label?: string;
  }
  let { name, label }: Props = $props();

  const glyph = $derived(glyphs[name as IconName]);
  $effect(() => {
    if (!glyph) console.warn(`[stemcell] Icon: 未知の name "${name}"(セットに無い。iconography.md §3)`);
  });
</script>

<!-- label があるときだけ意味を運ぶ(role=img + アクセシブルネーム)。無ければ装飾で隠す(aria-hidden)。
     mirrorInRTL のグリフは RTL で左右反転する(CSS。iconography.md §4) -->
{#if glyph}
  <svg
    class="sc-icon"
    {viewBox}
    width="1em"
    height="1em"
    fill="currentColor"
    data-mirror={glyph.mirrorInRTL ? 'true' : undefined}
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : 'true'}
  >
    <path d={glyph.path} fill-rule={glyph.fillRule} />
  </svg>
{/if}
