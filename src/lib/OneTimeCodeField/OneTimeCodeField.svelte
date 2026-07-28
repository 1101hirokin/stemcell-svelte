<script lang="ts">
  import './OneTimeCodeField.css';
  import '../internal/field-button.css';
  import { META, sanitize } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import type { Snippet } from 'svelte';
  import type { FullAutoFill } from 'svelte/elements';

  // 確認コードを打つ欄(OneTimeCodeField.md)。見えている枠は桁の数だけ並ぶが、打てる欄は一つである。
  // 桁ごとに分けると、貼り付けが一桁目にしか入らず、SMS からの自動入力(autocomplete=one-time-code)は
  // 一つの欄を前提にしているので効かず、読み上げは「6 個の欄のうち 1 個目」と読む。
  interface Props {
    name?: string;
    value?: string;
    /** 桁の数。発行する側の政策なので消費者が渡す。 */
    length?: number;
    /** 打てる文字。正規表現は受け取らない(§2)。 */
    charset?: (typeof META.props.charset.values)[number];
    /** 打った文字を伏せる。伏せたときは見せ直す操作が出る。 */
    masked?: boolean;
    /** 見せる操作の名前。masked が真のときに要る。 */
    revealLabel?: string;
    /** 隠す操作の名前。 */
    hideLabel?: string;
    /** 見せたときに支援技術へ届ける文。値そのものは流さない。 */
    revealedMessage?: string;
    /** 隠したときに支援技術へ届ける文。 */
    hiddenMessage?: string;
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
    required?: boolean;
    labelHidden?: boolean;
    size?: (typeof META.props.size.values)[number];
    /**
     * 届いた SMS のコードを待ち受ける(Web 方言。中立契約に無い)。Chromium だけが持つ道で、
     * 待ち受けるとブラウザの許可の確認が出る。SMS の本文が `@ドメイン #コード` の形でなければ働かない
     * (本文の形は送信側の仕事)。Safari は属性だけで候補を出すので、この prop は要らない。
     */
    autoReceive?: boolean;
    /** 値が変わった(逐次)。桁が揃う前の途中の値も流れる。 */
    onchange?: (value: string) => void;
    /** 桁が揃った。揃うたびに出る(貼り付けや自動入力で一度に埋まったときも)。 */
    oncomplete?: (value: string) => void;
    label: Snippet;
    description?: Snippet;
    error?: Snippet;
  }
  let {
    name,
    value = $bindable(META.props.value.default),
    length = META.props.length.default,
    charset = META.props.charset.default,
    masked = META.props.masked.default,
    revealLabel,
    hideLabel,
    revealedMessage,
    hiddenMessage,
    disabled = META.props.disabled.default,
    readonly = META.props.readonly.default,
    invalid = META.props.invalid.default,
    required = META.props.required.default,
    labelHidden = META.props.labelHidden.default,
    size = META.props.size.default,
    autoReceive = false,
    onchange,
    oncomplete,
    label,
    description,
    error,
  }: Props = $props();

  const uid = $props.id();
  const inputId = `${uid}-input`;
  const descriptionId = `${uid}-description`;
  const errorId = `${uid}-error`;

  const effectiveInvalid = $derived(readonly ? false : invalid);
  $effect(() => {
    if (readonly && invalid) {
      console.warn('[stemcell] OneTimeCodeField: readonly と invalid は同時に成立しない(state.md §6)。invalid を無視する。');
    }
    if (masked && !(revealLabel && hideLabel)) {
      console.warn('[stemcell] OneTimeCodeField: masked には revealLabel と hideLabel が要る(見せ直す手段の無い伏せ字は許さない)。');
    }
  });

  let revealed = $state(false);
  let announcement = $state('');
  let inputEl: HTMLInputElement | undefined = $state();
  let focused = $state(false);
  const hidden = $derived(masked && !revealed);

  const toggle = () => {
    revealed = !revealed;
    announcement = revealed ? (revealedMessage ?? '') : (hiddenMessage ?? '');
  };

  // 値を外から入れる道(自動入力・待ち受け)。打てない文字は落とし、揃えば知らせる
  const receive = (raw: string) => {
    const next = sanitize(raw, charset, length);
    if (!next || next === value) return;
    value = next;
    onchange?.(next);
    if (next.length === length) oncomplete?.(next);
  };

  // Chromium の WebOTP。待ち受けは欄が居るあいだだけで、離れたら中止する(許可の確認が残らない)。
  // 持たない環境では何も起きない(第7条 グレースフル・フォールバック)
  $effect(() => {
    if (!autoReceive || disabled || readonly) return;
    const creds = typeof navigator !== 'undefined' ? navigator.credentials : undefined;
    if (!creds || !('OTPCredential' in window)) return;
    const controller = new AbortController();
    creds
      .get({ otp: { transport: ['sms'] }, signal: controller.signal } as CredentialRequestOptions)
      .then((cred) => {
        const code = (cred as { code?: string } | null)?.code;
        if (code) receive(code);
      })
      .catch(() => {
        // 利用者が断った、時間切れ、画面を離れた。いずれも欄の側ですることは無い
      });
    return () => controller.abort();
  });

  const oninput = (e: Event & { currentTarget: HTMLInputElement }) => {
    const next = sanitize(e.currentTarget.value, charset, length);
    e.currentTarget.value = next; // 打てない文字は残さない
    if (next === value) return;
    value = next;
    onchange?.(next);
    // 揃うたびに知らせる。値の変化とは別の通知である(§2)
    if (next.length === length) oncomplete?.(next);
  };

  // 枠は見た目であって欄ではない。押しても焦点は一つの欄へ行く
  const cells = $derived(Array.from({ length }, (_, i) => i));
  const shown = (i: number) => {
    const ch = value[i];
    if (ch === undefined) return '';
    return hidden ? '•' : ch;
  };
  const activeIndex = $derived(Math.min(value.length, length - 1));

  const describedby = $derived(
    [description ? descriptionId : null, effectiveInvalid && error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined,
  );
</script>

<div
  class="sc-otc"
  data-size={size}
  data-invalid={effectiveInvalid}
  data-disabled={disabled}
  data-label-hidden={labelHidden}
>
  <label class="sc-otc-label" for={inputId}>
    {@render label()}{#if required}<span class="sc-otc-required" aria-hidden="true">*</span>{/if}
  </label>
  <div class="sc-otc-control">
    <!-- 桁の枠。見た目だけなので支援技術からは外す(値は一つの欄が持つ) -->
    <div class="sc-otc-cells" style:--sc-otc-length={length} aria-hidden="true">
      {#each cells as i (i)}
        <span
          class="sc-otc-cell"
          data-filled={value[i] !== undefined}
          data-active={focused && !disabled && !readonly && i === activeIndex}
        >{shown(i)}</span>
      {/each}
    </div>
    <!-- 本物の欄は一つ。文字は枠が描くので、ここでは文字も棒も透かす。
         貼り付けも自動入力も、この一つの欄へ一度で入る -->
    <input
      class="sc-otc-input"
      id={inputId}
      bind:this={inputEl}
      type="text"
      {name}
      value={value}
      {disabled}
      {readonly}
      {required}
      maxlength={length}
      autocomplete={'one-time-code' as FullAutoFill}
      inputmode={charset === 'numeric' ? 'numeric' : 'text'}
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      aria-invalid={effectiveInvalid ? 'true' : undefined}
      aria-describedby={describedby}
      {oninput}
      onfocus={() => (focused = true)}
      onblur={() => (focused = false)}
      onchangecapture={(e) => e.stopPropagation()}
    />
    {#if masked}
      <!-- 伏せたときは見せ直せる(PasswordField と同じ判断)。欄の中の付属なので正方形で角は丸めない -->
      <button
        type="button"
        class="sc-field-button sc-otc-toggle"
        aria-label={revealed ? hideLabel : revealLabel}
        disabled={disabled || readonly}
        onclick={toggle}
      >
        <Icon name={revealed ? 'password.unlocked' : 'password.locked'} />
      </button>
    {/if}
  </div>
  {#if masked}<span class="sc-otc-announcement" role="status">{announcement}</span>{/if}
  {#if description}<p class="sc-otc-description" id={descriptionId}>{@render description()}</p>{/if}
  {#if effectiveInvalid && error}<p class="sc-otc-error" id={errorId}>{@render error()}</p>{/if}
</div>
