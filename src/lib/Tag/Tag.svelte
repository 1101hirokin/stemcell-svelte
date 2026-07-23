<script lang="ts">
  import './Tag.css';
  import { META, WEB } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import closeGlyph from '@stemcell/icons/close';
  import checkGlyph from '@stemcell/icons/check';
  import type { Snippet } from 'svelte';

  // 分類の名札(Tag.md §1)。静的・選べる(selected)・消せる(dismissible)の3形は同じ部品で、名前も見た目の
  // 語彙も変わらない。variant は常在の重さだけ(soft/outlined。filled は Badge の役)。色は plain 固定(分類は
  // intent でない。§2)。静的な札は role も states も持たない(押せないものに反応を返さない。§3)。
  interface Props {
    variant?: (typeof META.props.variant.values)[number];
    size?: (typeof META.props.size.values)[number];
    /** 消せる名札。× の見た目は内部、公開 API は dismiss イベントだけ。 */
    dismissible?: boolean;
    /** 値であって状態ではない(state.md §6)。与えると「選べる名札」になる(省略=選べない)。 */
    selected?: boolean;
    /** 相互作用がある形(selected / dismissible)でのみ意味を持つ。 */
    disabled?: boolean;
    /** 選べる名札が押された(選択の切替はアプリが selected を更新して起こす)。 */
    onclick?: () => void;
    /** × が押された(取り除くのはアプリ。Tag は自分を消さない)。 */
    ondismiss?: () => void;
    /** × の削除語(Web 層の i18n。既定 Remove。上書き可。Tag.md §3 / i18n.md)。 */
    dismissLabel?: string;
    children: Snippet;
  }
  let {
    variant = META.props.variant.default,
    size = META.props.size.default,
    dismissible = META.props.dismissible.default,
    selected,
    disabled = META.props.disabled.default,
    onclick,
    ondismiss,
    dismissLabel = WEB.dismissLabel.default,
    children,
  }: Props = $props();

  // selected の値を持つ札だけが選べる(値と型が一致する側の設計。§2)。
  const selectable = $derived(selected !== undefined);

  const uid = $props.id();
  const bodyId = `${uid}-body`;
  const removeId = `${uid}-remove`;
</script>

{#if dismissible}
  <!-- 消せる形: 器の中で本体(選択 or 静的ラベル)と × を「兄弟」に置く。role=button の中に押せる × という
       対話要素の入れ子(WAI-ARIA のアンチパターン)にしない(§2)。フォーカス順は本体 → ×。× のアクセシブル
       ネームは本体ラベル(aria-labelledby)+ 削除語で合成する(§3)。 -->
  <span class="sc-tag" data-variant={variant} data-size={size} data-selected={selected} data-disabled={disabled || undefined} data-dismissible="true">
    {#if selectable}
      <button class="sc-tag-body" id={bodyId} type="button" aria-pressed={selected} {disabled} onclick={() => onclick?.()}>
        {@render bodyInner()}
      </button>
    {:else}
      <span class="sc-tag-body" id={bodyId}>{@render children()}</span>
    {/if}
    <button class="sc-tag-dismiss" type="button" aria-labelledby="{bodyId} {removeId}" {disabled} onclick={() => ondismiss?.()}>
      <Icon glyph={closeGlyph} />
    </button>
    <span id={removeId} hidden>{dismissLabel}</span>
  </span>
{:else if selectable}
  <!-- 選べる形: 全体が押下トグルのボタン。選択の伝達は aria-pressed(単体の選べる札。集合は Collection で再訪。§2) -->
  <button
    class="sc-tag"
    data-variant={variant}
    data-size={size}
    data-selected={selected}
    data-disabled={disabled || undefined}
    type="button"
    aria-pressed={selected}
    {disabled}
    onclick={() => onclick?.()}
  >
    {@render bodyInner()}
  </button>
{:else}
  <!-- 静的な形: ただの札。操作対象でなく role も states も立てない(§3) -->
  <span class="sc-tag" data-variant={variant} data-size={size}>{@render children()}</span>
{/if}

<!-- 選択の見せ方は Expressive: 先頭に check(§5 の第一候補)。装飾なので Icon が aria-hidden を付け、意味は
     aria-pressed が運ぶ。selected が undefined(静的)なら check は出ない。 -->
{#snippet bodyInner()}
  {#if selected}<Icon glyph={checkGlyph} />{/if}{@render children()}
{/snippet}
