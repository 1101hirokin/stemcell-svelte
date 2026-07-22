<script lang="ts">
  import './Icon.css';
  import type { Glyph } from '@stemcell/icons';

  // viewBox は全グリフ統一の定数(iconography.md §7)。@stemcell/icons から import すると
  // その値と同じモジュールにある全マップ(glyphs)まで main チャンクへ引き込まれ、glyph 渡しの
  // ツリーシェイクが壊れる(実測)。定数は直書きして静的 import を型だけにする。
  const viewBox = '0 0 32 32';

  // 語彙を絵で示す描画器(iconography.md)。色は currentColor、寸法は 1em。
  // 二つの口(iconography.md §6): name(中立契約。文字列。全束が入る)/ glyph(Web 方言。静的に
  // 取ってツリーシェイク。`import glyph from '@stemcell/icons/arrow.down'` して渡す)。
  // Icon は全マップを import しない: glyph 渡しでツリーシェイクを効かせるため。name の解決は
  // 別モジュール(./resolve)へ分け、glyph だけを使う消費者に全マップが混入しないようにする。
  interface Props {
    /** セットの意味名(中立契約。iconography.md §3)。全グリフが束に入る。 */
    name?: string;
    /** 静的に取ったグリフ(Web 方言。ツリーシェイク。iconography.md §6)。name より優先。 */
    glyph?: Glyph;
    /** 意味を運ぶときの名前。省略時は装飾で支援技術から隠れる(iconography.md §5)。 */
    label?: string;
  }
  let { name, glyph, label }: Props = $props();

  // name の解決は動的 import で分離する: glyph だけの消費者のバンドルに全マップを混入させない。
  let resolved = $state<Glyph | undefined>(undefined);
  $effect(() => {
    if (glyph) {
      resolved = glyph;
    } else if (name) {
      // 全マップは name を使うときだけ読み込む(動的 import はバンドルを別チャンクに分ける)
      import('./resolve').then(({ resolveByName }) => {
        resolved = resolveByName(name!);
        if (!resolved) console.warn(`[stemcell] Icon: 未知の name "${name}"(セットに無い。iconography.md §3)`);
      });
    } else {
      resolved = undefined;
    }
  });
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
