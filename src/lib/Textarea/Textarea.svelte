<script lang="ts">
  import './Textarea.css';
  import { META } from './meta';
  import ClearButton from '../internal/ClearButton.svelte';
  import type { Snippet } from 'svelte';
  import type { FullAutoFill } from 'svelte/elements';

  // TextField を継承する複数行入力(契約 extends。Textarea.md §1)。start / end は持たない
  // (複数行の器にアイコンの行内配置は成立しない。契約が意図的に再宣言しない)。
  interface Props {
    /** フォーム名(native の <form> 送信・FormData・reset に参加。field.md §5)。 */
    name?: string;
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    /** 値をまとめて消す操作を出す(TextField から降りる prop。TextField.md §2)。 */
    clearable?: boolean;
    /** 消す操作の名前。clearable が真のときに要る。 */
    clearLabel?: string;
    invalid?: boolean;
    required?: boolean;
    autocomplete?: string;
    keyboard?: (typeof META.props.keyboard.values)[number];
    size?: (typeof META.props.size.values)[number];
    /** 初期の行高。上限ではない(契約: 自動成長は Expressive。field-sizing はまだ Baseline 未達)。 */
    rows?: number;
    /** 高さの上限(行数)。省略すると上限を持たない。rows と同じ値を与えると高さが固定される。 */
    maxRows?: number;
    onchange?: (value: string) => void;
    label: Snippet;
    description?: Snippet;
    error?: Snippet;
  }
  let {
    name,
    value = $bindable(META.props.value.default),
    placeholder,
    disabled = META.props.disabled.default,
    readonly = META.props.readonly.default,
    clearable = META.props.clearable.default,
    clearLabel,
    invalid = META.props.invalid.default,
    required = META.props.required.default,
    autocomplete,
    keyboard = META.props.keyboard.default,
    size = META.props.size.default,
    rows = META.props.rows.default,
    maxRows,
    onchange,
    label,
    description,
    error,
  }: Props = $props();

  const uid = $props.id();
  const inputId = `${uid}-input`;
  const descriptionId = `${uid}-description`;
  const errorId = `${uid}-error`;

  let inputEl: HTMLTextAreaElement | undefined = $state();
  const showClear = $derived(clearable && value !== '' && !disabled && !readonly);
  $effect(() => {
    if (clearable && !clearLabel) {
      console.warn('[stemcell] Textarea: clearable には clearLabel が要る(絵だけの操作は名前を持つ)。');
    }
  });
  const clear = () => {
    if (!showClear) return;
    value = '';
    onchange?.('');
    inputEl?.focus(); // 消すのは打ち直すためなので、焦点は欄に残す
  };
  // Escape で消す(RFC 0021)。値があるときだけ消してそこで止め、空なら外へ抜く
  const onkeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !showClear) return;
    e.preventDefault();
    e.stopPropagation();
    clear();
  };

  // readonly は invalid と同時に成立しない(state.md §6。HOLES #14。TextField と同じ)
  const effectiveInvalid = $derived(readonly ? false : invalid);
  $effect(() => {
    if (readonly && invalid) {
      console.warn(
        '[stemcell] Textarea: readonly と invalid は同時に成立しない(state.md §6)。invalid を無視する。',
      );
    }
  });

  const describedby = $derived(
    [description ? descriptionId : null, effectiveInvalid && error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined,
  );
</script>

<div class="sc-textarea" data-size={size} data-invalid={effectiveInvalid} data-disabled={disabled}>
  <label class="sc-textarea-label" for={inputId}>
    {@render label()}{#if required}<span class="sc-textarea-required" aria-hidden="true">*</span
      >{/if}
  </label>
  <div class="sc-textarea-control">
    <!-- native の確定 change の遮断は TextField と同じ(HOLES #13。Enter は改行で値の変化。契約 a11y) -->
    <textarea
      class="sc-textarea-input"
      id={inputId}
      bind:this={inputEl}
      style:--sc-textarea-rows={rows}
      style:--sc-textarea-max-rows={maxRows}
      {name}
      {rows}
      bind:value
      {placeholder}
      {disabled}
      {readonly}
      {required}
      autocomplete={autocomplete as FullAutoFill | undefined}
      inputmode={keyboard}
      aria-invalid={effectiveInvalid ? 'true' : undefined}
      aria-describedby={describedby}
      oninput={(e) => onchange?.(e.currentTarget.value)}
      onchangecapture={(e) => e.stopPropagation()}
      {onkeydown}
    ></textarea>
    {#if showClear}<ClearButton label={clearLabel} onclear={clear} />{/if}
  </div>
  {#if description}<p class="sc-textarea-description" id={descriptionId}>
      {@render description()}
    </p>{/if}
  {#if effectiveInvalid && error}<p class="sc-textarea-error" id={errorId}>
      {@render error()}
    </p>{/if}
</div>
