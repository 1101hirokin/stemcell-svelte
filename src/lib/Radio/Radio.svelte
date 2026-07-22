<script lang="ts">
  import './Radio.css';
  import { META } from './meta';
  import { getRadioGroupContext } from '../RadioGroup/context';
  import type { Snippet } from 'svelte';

  // RadioGroup の項目。単体では使えない(グループの外に単一選択は存在しない。契約)。
  // checked を持たず、選ばれているかはグループの value との一致から導く。
  interface Props {
    /** この項目の識別子(既定を持たない。識別子の無い選択肢は集合に立てない)。 */
    value: string;
    disabled?: boolean;
    label: Snippet;
    description?: Snippet;
  }
  let { value, disabled = META.props.disabled.default, label, description }: Props = $props();

  const group = getRadioGroupContext();
  if (!group) {
    // 単体では使えない(契約)。文脈が無ければ warn(グループの外に単一選択は存在しない)
    console.warn('[stemcell] Radio: RadioGroup の外では使えない(契約。グループが値を所有する)');
  }

  const uid = $props.id();
  const inputId = `${uid}-input`;
  const descriptionId = `${uid}-description`;

  // 選ばれているか = グループの value との一致(導出値。prop ではない)
  const checked = $derived(group?.value === value);
  // この項目の無効 = 自分の disabled または グループの disabled(独立に立てられる)
  const isDisabled = $derived(disabled || (group?.disabled ?? false));
  // invalid はグループが宣言する。danger が項目の描画へ降りる(Radio は invalid prop を持たない)
  const isInvalid = $derived(group?.invalid ?? false);
</script>

<div class="sc-radio-field" data-invalid={isInvalid} data-disabled={isDisabled}>
  <!-- native radio を同一 name(グループの文脈)で束ねる → 矢印キー・roving tabindex・disabled
       スキップをブラウザが提供する(web-keys arrows.radiogroup)。視覚は sibling の丸が描く。
       label の対話要素の活性化は選択へ伝播しない(native <label> の interactive descendant 例外) -->
  <label class="sc-radio">
    <input
      class="sc-radio-input"
      id={inputId}
      type="radio"
      name={group?.name}
      {value}
      {checked}
      disabled={isDisabled}
      aria-describedby={description ? descriptionId : undefined}
      onchange={() => group?.select(value)}
    />
    <span class="sc-radio-circle" aria-hidden="true"></span>
    <span class="sc-radio-label">{@render label()}</span>
  </label>
  {#if description}<p class="sc-radio-description" id={descriptionId}>
      {@render description()}
    </p>{/if}
</div>
