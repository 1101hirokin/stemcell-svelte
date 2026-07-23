<script lang="ts">
  import './RadioGroup.css';
  import { META } from './meta';
  import { setRadioGroupContext } from './context';
  import type { Snippet } from 'svelte';

  // 相互排他の選択肢の集合。値はグループがひとつ持つ(field.md §5)。グループ名は集合の名前で
  // fieldset / legend が運ぶ(WCAG 1.3.1)。矢印キー・roving tabindex は native radio に任せる。
  interface Props {
    /** グループのフォーム名(native の <form> 送信に参加。各 Radio へ配る。未指定なら内部名で束ねる。field.md §5)。 */
    name?: string;
    value?: string;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    /** 契約の change(payload は新しく選ばれた value。field.md §5)。 */
    onchange?: (value: string) => void;
    label: Snippet;
    description?: Snippet;
    error?: Snippet;
    /** 項目(Radio)の列。 */
    children: Snippet;
  }
  let {
    name,
    value = $bindable(undefined),
    disabled = META.props.disabled.default,
    invalid = META.props.invalid.default,
    required = META.props.required.default,
    onchange,
    label,
    description,
    error,
    children,
  }: Props = $props();

  const uid = $props.id();
  // native radio を束ねる共有 name。消費者が name を与えれば送信に使い、無ければ内部名で束ねるだけ。
  const autoName = `${uid}-radio`;
  const labelId = `${uid}-label`;
  const descriptionId = `${uid}-description`;
  const errorId = `${uid}-error`;

  const describedby = $derived(
    [description ? descriptionId : null, invalid && error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined,
  );

  // 項目へ渡す文脈。getter で反応的に読ませる(name / value / disabled / invalid / required の変化が項目へ伝わる)。
  setRadioGroupContext({
    get name() {
      return name ?? autoName;
    },
    get value() {
      return value;
    },
    get disabled() {
      return disabled;
    },
    get invalid() {
      return invalid;
    },
    get required() {
      return required;
    },
    select(v: string) {
      value = v; // bind:value の土地の便宜。非 bind でも onchange でアプリが更新する
      onchange?.(v);
    },
  });
</script>

<!-- グループ自身はフォーカスを受けない(契約 a11y。focusRing false)。焦点と輪郭は項目に立つ。
     fieldset / legend が集合の名前を運ぶ(H71)。invalid はグループの状態として届く -->
<fieldset
  class="sc-radiogroup"
  role="radiogroup"
  data-invalid={invalid}
  data-disabled={disabled}
  {disabled}
  aria-labelledby={labelId}
  aria-describedby={describedby}
  aria-invalid={invalid ? 'true' : undefined}
  aria-required={required ? 'true' : undefined}
>
  <legend class="sc-radiogroup-label" id={labelId}>
    {@render label()}{#if required}<span class="sc-radiogroup-required" aria-hidden="true">*</span
      >{/if}
  </legend>
  <div class="sc-radiogroup-items">
    {@render children()}
  </div>
  {#if description}<p class="sc-radiogroup-description" id={descriptionId}>
      {@render description()}
    </p>{/if}
  {#if invalid && error}<p class="sc-radiogroup-error" id={errorId}>{@render error()}</p>{/if}
</fieldset>
