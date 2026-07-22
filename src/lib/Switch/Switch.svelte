<script lang="ts">
  import './Switch.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  // 独立した設定の on/off(field.md §7)。invalid / indeterminate / required を持たない
  // (部分集合の選択。state.md §4)。Space で切り替わる(role=switch を native checkbox に載せる)。
  interface Props {
    checked?: boolean;
    disabled?: boolean;
    /** 契約の change(payload は新しい checked。即時反映が前提。field.md §5/§7)。 */
    onchange?: (checked: boolean) => void;
    label: Snippet;
    description?: Snippet;
  }
  let {
    checked = $bindable(META.props.checked.default),
    disabled = META.props.disabled.default,
    onchange,
    label,
    description,
  }: Props = $props();

  const uid = $props.id();
  const inputId = `${uid}-input`;
  const descriptionId = `${uid}-description`;
</script>

<div class="sc-switch-field" data-disabled={disabled}>
  <label class="sc-switch">
    <!-- role=switch を native checkbox に載せる(web-keys: Space で切替。aria-checked は真偽値のみ)。
         native change = トグル = 契約 change のため capture 遮断は不要(Checkbox と同じ。HOLES #13 の非対称なし) -->
    <input
      class="sc-switch-input"
      id={inputId}
      type="checkbox"
      role="switch"
      bind:checked
      {disabled}
      aria-describedby={description ? descriptionId : undefined}
      onchange={(e) => onchange?.(e.currentTarget.checked)}
    />
    <span class="sc-switch-track" aria-hidden="true"><span class="sc-switch-thumb"></span></span>
    <span class="sc-switch-label">{@render label()}</span>
  </label>
  {#if description}<p class="sc-switch-description" id={descriptionId}>
      {@render description()}
    </p>{/if}
</div>
