<script lang="ts">
  import './Select.css';
  import { META } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import type { Snippet } from 'svelte';

  // 閉じた選択肢からひとつ選ぶ入力。Web は native <select> を基本とする(Select.md §2)。
  // 構造・トークンは TextField と同型(field.md §6)。開閉はブラウザが所有(契約に open を持たない)。
  interface Option {
    value: string;
    label: string;
    disabled?: boolean;
  }
  interface Props {
    /** 選択中の value。空文字は未選択。アプリが所有する(field.md §5)。 */
    value?: string;
    /** 選択肢の列。データとして渡す(裁定: native select は文字列 label のみ)。 */
    options: Option[];
    /** 未選択時の表示。label の代替ではない。Web の表現は無効化された先頭 option。 */
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    size?: (typeof META.props.size.values)[number];
    /** 契約の change。payload は新しい value(field.md §5)。離散なので逐次/確定の区別が無い。 */
    onchange?: (value: string) => void;
    label: Snippet;
    description?: Snippet;
    error?: Snippet;
  }
  let {
    value = $bindable(META.props.value.default),
    options,
    placeholder,
    disabled = META.props.disabled.default,
    invalid = META.props.invalid.default,
    required = META.props.required.default,
    size = META.props.size.default,
    onchange,
    label,
    description,
    error,
  }: Props = $props();

  const uid = $props.id();
  const inputId = `${uid}-input`;
  const descriptionId = `${uid}-description`;
  const errorId = `${uid}-error`;

  const describedby = $derived(
    [description ? descriptionId : null, invalid && error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined,
  );
</script>

<div class="sc-select" data-size={size} data-invalid={invalid} data-disabled={disabled}>
  <label class="sc-select-label" for={inputId}>
    {@render label()}{#if required}<span class="sc-select-required" aria-hidden="true">*</span
      >{/if}
  </label>
  <div class="sc-select-control">
    <!-- native select が値と a11y(role=combobox。HTML-AAM)の源。開閉キーは UA 所有。
         change でのページ遷移/送信は禁止(WCAG 3.2.2)だが機械強制できないので結線側の規範 -->
    <select
      class="sc-select-input"
      id={inputId}
      bind:value
      {disabled}
      {required}
      aria-invalid={invalid ? 'true' : undefined}
      aria-describedby={describedby}
      onchange={(e) => onchange?.(e.currentTarget.value)}
    >
      {#if placeholder !== undefined}
        <option value="" disabled>{placeholder}</option>
      {/if}
      {#each options as opt (opt.value)}
        <option value={opt.value} disabled={opt.disabled}>{opt.label}</option>
      {/each}
    </select>
    <!-- 開閉インジケータ(expressive)。native の矢印は appearance:none で消し、自前で描く。装飾 -->
    <span class="sc-select-chevron" aria-hidden="true"><Icon name="chevron.down" /></span>
  </div>
  {#if description}<p class="sc-select-description" id={descriptionId}>
      {@render description()}
    </p>{/if}
  {#if invalid && error}<p class="sc-select-error" id={errorId}>
      {@render error()}
    </p>{/if}
</div>
