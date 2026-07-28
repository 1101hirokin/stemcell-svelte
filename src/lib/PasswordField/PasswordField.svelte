<script lang="ts">
  import './PasswordField.css';
  import { META } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import ClearButton from '../internal/ClearButton.svelte';
  import type { Snippet } from 'svelte';
  import type { FullAutoFill } from 'svelte/elements';

  // 秘匿して打つ欄(PasswordField.md)。隠したまま打たせると、打ち間違いを直す手段が全部消して打ち直す
  // ことしか無くなるので、切り替えは器が必ず持つ。切り替えたことは文で知らせ、値そのものは読み上げに
  // 流さない(GOV.UK の裁定。周りに人が居る場所でパスワードが声に出る)。
  interface Props {
    name?: string;
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
    required?: boolean;
    /** ログインは current-password、新しく決める欄は new-password。器は決められない。 */
    autocomplete?: string;
    keyboard?: (typeof META.props.keyboard.values)[number];
    size?: (typeof META.props.size.values)[number];
    /** 見せる操作の名前。 */
    revealLabel: string;
    /** 隠す操作の名前。 */
    hideLabel: string;
    /** 見せたときに支援技術へ届ける文。値そのものは流さない。 */
    revealedMessage: string;
    /** 隠したときに支援技術へ届ける文。 */
    /** 値をまとめて消す操作を出す(TextField から降りる prop。TextField.md §2)。 */
    clearable?: boolean;
    /** 消す操作の名前。clearable が真のときに要る。 */
    clearLabel?: string;
    hiddenMessage: string;
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
    invalid = META.props.invalid.default,
    required = META.props.required.default,
    autocomplete,
    keyboard = META.props.keyboard.default,
    size = META.props.size.default,
    clearable = META.props.clearable.default,
    clearLabel,
    revealLabel,
    hideLabel,
    revealedMessage,
    hiddenMessage,
    onchange,
    label,
    description,
    error,
  }: Props = $props();

  const uid = $props.id();
  const inputId = `${uid}-input`;
  const descriptionId = `${uid}-description`;
  const errorId = `${uid}-error`;

  // readonly は invalid と同時に成立しない(state.md §6。TextField と同じ扱い)
  const effectiveInvalid = $derived(readonly ? false : invalid);
  $effect(() => {
    if (readonly && invalid) {
      console.warn(
        '[stemcell] PasswordField: readonly と invalid は同時に成立しない(state.md §6)。invalid を無視する。',
      );
    }
  });

  // 既定は隠す。切り替えの結果だけを文で伝え、値は流さない
  let inputEl: HTMLInputElement | undefined = $state();
  // 消す操作(TextField から降りる prop)。切り替えの隣に立つので、消費者は詰み具合を見て決める
  const showClear = $derived(clearable && value !== '' && !disabled && !readonly);
  $effect(() => {
    if (clearable && !clearLabel) {
      console.warn('[stemcell] PasswordField: clearable には clearLabel が要る(絵だけの操作は名前を持つ)。');
    }
  });
  const clear = () => {
    if (!showClear) return;
    value = '';
    onchange?.('');
    inputEl?.focus();
  };
  // Escape で消す(RFC 0021)。値があるときだけ消してそこで止め、空なら外へ抜く
  const onkeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !showClear) return;
    e.preventDefault();
    e.stopPropagation();
    clear();
  };

  let revealed = $state(false);
  // 生きた領域は最初から DOM に居て、中身だけ差し替える(後から現れる領域は拾われない)
  let announcement = $state('');
  const toggle = () => {
    revealed = !revealed;
    announcement = revealed ? revealedMessage : hiddenMessage;
  };

  const describedby = $derived(
    [description ? descriptionId : null, effectiveInvalid && error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined,
  );
</script>

<div class="sc-passwordfield" data-size={size} data-invalid={effectiveInvalid} data-disabled={disabled}>
  <label class="sc-passwordfield-label" for={inputId}>
    {@render label()}{#if required}<span class="sc-passwordfield-required" aria-hidden="true">*</span>{/if}
  </label>
  <div class="sc-passwordfield-control">
    <input
      class="sc-passwordfield-input"
      id={inputId}
      bind:this={inputEl}
      type={revealed ? 'text' : 'password'}
      {name}
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
    />
    {#if showClear}<ClearButton label={clearLabel} onclear={clear} />{/if}
    <!-- 切り替えは焦点を受ける(矢印キーのような代替が無いので、タブ順から外せない)。
         名前は状態で入れ替わり、aria-pressed は使わない(押されていることと、見えていることは別) -->
    <button
      type="button"
      class="sc-passwordfield-toggle"
      aria-label={revealed ? hideLabel : revealLabel}
      disabled={disabled || readonly}
      onclick={toggle}
    >
      <Icon name={revealed ? 'password.unlocked' : 'password.locked'} />
    </button>
  </div>
  <!-- 切り替えの結果だけを届ける。値そのものは流さない(GOV.UK の裁定) -->
  <span class="sc-passwordfield-announcement" role="status">{announcement}</span>
  {#if description}<p class="sc-passwordfield-description" id={descriptionId}>{@render description()}</p>{/if}
  {#if effectiveInvalid && error}<p class="sc-passwordfield-error" id={errorId}>{@render error()}</p>{/if}
</div>
