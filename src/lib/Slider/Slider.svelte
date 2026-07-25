<script lang="ts">
  import './Slider.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  // 範囲の中から値をひとつ、位置で選ぶ入力(Slider.md)。おおよその値で足りる場面のための部品で、
  // 正確な値が要るなら数値入力を併設する。
  interface Props {
    /** 現在値。アプリが所有する(field.md §5)。既定は持たない(基準の無い初期位置は嘘の既定になる)。 */
    value: number;
    /** フォーム内でのフィールド名(native の form 送信・FormData・reset に参加。契約 alpha.1)。 */
    name?: string;
    /** 下限。 */
    min?: number;
    /** 上限。 */
    max?: number;
    /** 刻み幅(native / SwiftUI と同じ意味論。Compose の steps とは別の観念)。 */
    step?: number;
    /** state.md §3.1 / §5。 */
    disabled?: boolean;
    /** 名前(必須。無名は許さない。field.md §2)。 */
    label: Snippet;
    /** 説明(field.md §2)。 */
    description?: Snippet;
    /** 値が変わった(逐次。ドラッグ中も発火する)。 */
    onchange?: (value: number) => void;
    /** 操作の一続きが終わった(確定値)。 */
    onchangeend?: (value: number) => void;
  }
  let {
    value = $bindable(),
    name,
    min = META.props.min.default,
    max = META.props.max.default,
    step = META.props.step.default,
    disabled = META.props.disabled.default,
    label,
    description,
    onchange,
    onchangeend,
  }: Props = $props();

  const uid = $props.id();
  const inputId = `${uid}-input`;
  const descriptionId = `${uid}-description`;

  // 帯の塗り分けはトラックの擬似要素を跨いで書けないので、値の位置を custom property で渡し
  // background の linear-gradient で描く(Slider.md の実装メモ)。範囲が退化していたら 0 とする。
  const percent = $derived(max > min ? ((value - min) / (max - min)) * 100 : 0);

  const handleInput = (e: Event) => {
    const next = (e.currentTarget as HTMLInputElement).valueAsNumber;
    value = next;
    onchange?.(next);
  };
  const handleChange = (e: Event) => {
    onchangeend?.((e.currentTarget as HTMLInputElement).valueAsNumber);
  };
</script>

<!-- native <input type="range"> を土台にする(憲法 第2条 / RFC 0010)。契約が Normative に持つ要求を
     native がまとめて満たす: WCAG 2.5.7(ドラッグだけで操作できてはならない。F108)、web-keys の
     arrows.slider(規則ファイル自身が「native の <input type=range> / APG Slider Pattern に一致」と書く)、
     トラック上の単一ポインタ操作、タッチとページスクロールの分離、step の丸め、RTL、form 参加。
     role=slider と aria-valuenow / valuemin / valuemax も native が持つので自前で立てない。
     イベントは native の input=逐次 / change=確定が契約の change / changeEnd にそのまま写る。 -->
<div class="sc-slider" data-disabled={disabled}>
  <label class="sc-slider-label" for={inputId}>{@render label()}</label>
  <input
    class="sc-slider-input"
    id={inputId}
    type="range"
    {name}
    {min}
    {max}
    {step}
    {disabled}
    {value}
    aria-describedby={description ? descriptionId : undefined}
    style="--_percent: {percent}%"
    oninput={handleInput}
    onchange={handleChange}
  />
  {#if description}
    <span class="sc-slider-description" id={descriptionId}>{@render description()}</span>
  {/if}
</div>
