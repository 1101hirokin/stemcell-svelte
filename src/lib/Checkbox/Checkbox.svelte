<script lang="ts">
  import './Checkbox.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  interface Props {
    /** フォーム名(native の <form> 送信・FormData・reset に参加。checked のとき値が載る。field.md §5)。 */
    name?: string;
    checked?: boolean;
    /** 第三の値(state.md §6)。見た目と aria-checked=mixed を上書きするが checked は変えない。 */
    indeterminate?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    /** 契約の change(payload は新しい checked。field.md §5)。切替でのみ発火する。 */
    onchange?: (checked: boolean) => void;
    label: Snippet;
    description?: Snippet;
    error?: Snippet;
  }
  let {
    name,
    checked = $bindable(META.props.checked.default),
    indeterminate = $bindable(META.props.indeterminate.default),
    disabled = META.props.disabled.default,
    invalid = META.props.invalid.default,
    required = META.props.required.default,
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

  // native の <input> が値の真の源。indeterminate は属性でなくプロパティなので参照経由で立てる
  // (aria-checked=mixed は native がこの property から導く。契約 a11y)。
  let input = $state<HTMLInputElement>();
  $effect(() => {
    if (input) input.indeterminate = indeterminate;
  });
</script>

<div class="sc-checkbox-field" data-invalid={invalid} data-disabled={disabled}>
  <!-- native の <label> がラップする: 中の対話要素(リンク)クリックはトグルへ転送されない
       (HTML 仕様: label の活性化は interactive content の子孫では何もしない)。二重発火は
       この native 挙動で防ぐ(契約 a11y。実測は Checkbox.test.ts と smoke) -->
  <!-- TextField と違い native change の capture 遮断は不要(HOLES #13 の非対称)。native の
       change はトグルそのもので契約の change(新しい checked)と意味が一致するため、light DOM を
       バブルして漏れても取り違えが起きない。TextField は契約 change を逐次に再定義したため native の
       確定 change と衝突したが、ここは再定義していない(独立レビュー minor で明文化) -->
  <label class="sc-checkbox">
    <input
      bind:this={input}
      class="sc-checkbox-input"
      id={inputId}
      type="checkbox"
      {name}
      bind:checked
      {disabled}
      {required}
      aria-invalid={invalid ? 'true' : undefined}
      aria-describedby={describedby}
      onchange={(e) => { indeterminate = false; onchange?.(e.currentTarget.checked); }}
    />
    <span class="sc-checkbox-box" aria-hidden="true"></span>
    <span class="sc-checkbox-label"
      >{@render label()}{#if required}<span class="sc-checkbox-required" aria-hidden="true">*</span
        >{/if}</span
    >
  </label>
  {#if description}<p class="sc-checkbox-description" id={descriptionId}>
      {@render description()}
    </p>{/if}
  {#if invalid && error}<p class="sc-checkbox-error" id={errorId}>{@render error()}</p>{/if}
</div>
