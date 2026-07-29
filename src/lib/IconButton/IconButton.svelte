<script lang="ts">
  import './IconButton.css';
  import { META, WEB } from './meta';
  import type { Snippet } from 'svelte';

  // Button の一種。ラベルが絵になっただけ(契約 extends。IconButton.md §1)。variant/color/size/
  // disabled/fill/states は Button を継承。start/end は継承しない(スロット構成は部品の形。契約)。
  interface Props {
    variant?: (typeof META.props.variant.values)[number];
    color?: (typeof META.props.color.values)[number];
    size?: (typeof META.props.size.values)[number];
    disabled?: boolean;
    fill?: boolean;
    /** shape.md §6 のカテゴリから選ぶ。pill は全円、control は角丸(既定)。 */
    shape?: (typeof META.props.shape.values)[number];
    /** 名前(必須)。可視ラベルが絵に置き換わったぶん名前の経路が prop へ移る(IconButton.md §3)。 */
    label: string;
    /** フォーム参加の type。Web 層の取り決め(Button.md §6。既定 button。HOLES #24)。 */
    type?: (typeof WEB.type.values)[number];
    /** 契約の click。Svelte 5 の土地の声では callback prop(HOLES #4)。 */
    onclick?: () => void;
    /** アイコン1つ(iconography.md §2)。文字は置かない(文字を持つなら Button)。 */
    children: Snippet;
  }
  let {
    variant = META.props.variant.default,
    color = META.props.color.default,
    size = META.props.size.default,
    disabled = META.props.disabled.default,
    fill = META.props.fill.default,
    shape = META.props.shape.default,
    label,
    type = WEB.type.default,
    onclick,
    children,
  }: Props = $props();
</script>

<!-- 名前は aria-label(label prop)が運ぶ。中の絵は装飾で名前を二重に運ばない(iconography.md §5)。
     当たり判定は絵1つでも縮まない(size.md §4。inset で門/目標に届く)。 -->
<button
  class="sc-iconbutton"
  data-variant={variant}
  data-color={color}
  data-size={size}
  data-shape={shape}
  data-fill={fill}
  {type}
  {disabled}
  aria-label={label}
  onclick={() => {
    if (!disabled) onclick?.();
  }}
>
  <span class="sc-iconbutton-glyph" aria-hidden="true">{@render children()}</span>
</button>
