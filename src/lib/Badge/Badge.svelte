<script lang="ts">
  import './Badge.css';
  import '../internal/visually-hidden.css';
  import { META } from './meta';
  import Imposter from '../Imposter/Imposter.svelte';
  import type { Snippet } from 'svelte';

  // 状態や数の小さな印(Badge.md §1)。読むものであって押せない(states 無し・当たり判定の門の対象外)。
  // 数(count)と存在(dot)だけを扱う: 文字の札は Tag、文の報告は Alert / Toast。
  interface Props {
    /** 量の報告。非負整数を期待する。dot=true のときは使われない。 */
    count?: number;
    /** count がこれを超えたら「{max}+」に丸める(丸めは部品の仕事=全実装で同じ見た目)。 */
    max?: number;
    /** 存在の報告。数を出さない明示のモード。桁あふれから自動で dot にはならない(§2)。 */
    dot?: boolean;
    /** 印の意味を支援技術へ届ける(dot のとき事実上必須。点は視覚でしか語らない。§3)。 */
    label?: string;
    /** 報告の intent(primary / plain は持たない。報告の intent だけ。Badge.md §2)。 */
    color?: (typeof META.props.color.values)[number];
    /** 既定は filled(印は濃い。soft の印は印にならない。§2)。 */
    variant?: (typeof META.props.variant.values)[number];
    /** 印を重ねる相手(anchor)。省略時は行内に単独で並ぶ。 */
    children?: Snippet;
  }
  let {
    count,
    max = META.props.max.default,
    dot = META.props.dot.default,
    label,
    color = META.props.color.default,
    variant = META.props.variant.default,
    children,
  }: Props = $props();

  // count 無し・dot 無しは何も描かない(空の Badge は無を意味する。契約 a11y)。
  const visible = $derived(dot || count != null);
  // max 超は「{max}+」へ丸める。丸めても量の意味は保つ(存在へ降格しない。§2)。
  const shown = $derived(count != null && count > max ? `${max}+` : `${count}`);

  // dot は視覚でしか語らないので label 無しでは見える人にだけ通知が届く(第1条)。機械は付け忘れを
  // 契約では捕まえられない(Icon の label と同型)が、実行時に開発者へ知らせる。
  $effect(() => {
    if (dot && !label) {
      console.warn(
        '[stemcell] Badge: dot=true には label を与えてください(点は支援技術に存在を届けません。Badge.md §3)。',
      );
    }
  });
</script>

<!-- anchor があるときだけ包む。重ねは Imposter に委ねる(部品内部の重なりも同じ原始で組む=自己利用)。
     隅は Badge.md §5 が確定した block 軸 start × inline 軸 end で、半分はみ出す量だけが Badge の
     Expressive として印自身に残る。行内モードなのは、anchor が行内の操作子(IconButton 等)だから。
     anchor が無いときは印が行内に単独で並ぶ(重複の無い単一の印マークアップ) -->
{#if children}
  <Imposter inline alignBlock="start" alignInline="end">
    {#snippet base()}{@render children()}{/snippet}
    {#if visible}{@render badge(true)}{/if}
  </Imposter>
{:else if visible}
  {@render badge(false)}
{/if}

{#snippet badge(anchored: boolean)}
  <span
    class="sc-badge"
    data-anchored={anchored ? 'true' : undefined}
    data-dot={dot}
    data-color={color}
    data-variant={variant}
  >
    {#if dot}
      {#if label}<span class="sc-badge-sr sc-visually-hidden">{label}</span>{/if}
    {:else}{shown}{/if}
  </span>
{/snippet}
