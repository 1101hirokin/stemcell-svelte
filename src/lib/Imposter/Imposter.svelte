<script lang="ts">
  import './Imposter.css';
  import { META, WEB } from './meta';
  import type { Snippet } from 'svelte';

  // 下地の上への重ね(Imposter.md)。部品が下地と重ねの両方を持ち、下地が部品の大きさを決める。
  // 守らない・閉じない・奪わない: scrim もフォーカス捕捉も退出も持たない(それは Dialog / Popover)。
  interface Props {
    /** layering の層を指定して重ね順を取る。省略時は新しい層を作らない(第3条の抑制)。 */
    layer?: (typeof META.props.layer.values)[number];
    /** 重ねを置く block 軸(横書きでは縦)の位置。論理方向なので RTL / 縦書きで書字方向に従う。 */
    alignBlock?: (typeof META.props.alignBlock.values)[number];
    /** 重ねを置く inline 軸(横書きでは横)の位置。 */
    alignInline?: (typeof META.props.alignInline.values)[number];
    /** 外箱を行内に置く(Web 固有の取り決め。Imposter.md §3)。行内の下地に重ねるとき使う。 */
    inline?: boolean;
    /** 下地。部品の大きさを決め、重ねの位置の基準になる。 */
    base: Snippet;
    /** 重ねる中身。フローの外に出るので下地の大きさに影響しない。 */
    children: Snippet;
  }
  let {
    layer,
    alignBlock = META.props.alignBlock.default,
    alignInline = META.props.alignInline.default,
    inline = WEB.inline.default,
    base,
    children,
  }: Props = $props();

  // 行内モードでは span を出す。div を行内へ置くと、段落(<p>)の中では暗黙の閉じが起きて
  // 構造が壊れる。塊モードは他のレイアウト原始と同じく div。
  const tag = $derived(inline ? 'span' : 'div');
</script>

<!-- 見た目と意味を持たない部品(契約 a11y): states 無し・focus 無し・構造の主張無し。
     下地と重ねはどちらも支援技術から読め、覆っても意味(モーダル性)は生まれない。
     DOM の順は下地が先・重ねが後で、視覚の重なりと読み上げの順を入れ替えない(WCAG 1.3.2)。
     部品が自分で基準を持つのが本部品の要である: 基準を外(祖先の position / transform /
     container-type 等)に求めると、重ねと無関係な変更で位置が黙って動く(Imposter.md §2)。 -->
<svelte:element this={tag} class="sc-imposter" data-inline={inline ? 'true' : undefined}>
  {@render base()}
  <svelte:element
    this={tag}
    class="sc-imposter-overlay"
    data-align-block={alignBlock}
    data-align-inline={alignInline}
    data-layer={layer}
  >
    {@render children()}
  </svelte:element>
</svelte:element>
