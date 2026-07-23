<script lang="ts">
  import './TextField.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';
  import type { FullAutoFill } from 'svelte/elements';

  interface Props {
    /** フォーム名(native の <form> 送信・FormData・reset に参加。field.md §5)。 */
    name?: string;
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
    required?: boolean;
    /** WHATWG Autofill の開いた語彙(契約: 値域の機械検査は未整備)。string で受け、native 属性へは cast で渡す。 */
    autocomplete?: string;
    keyboard?: (typeof META.props.keyboard.values)[number];
    size?: (typeof META.props.size.values)[number];
    /** 契約の change(逐次。payload は新しい値)。Svelte 5 の土地の声では callback prop(HOLES #4 と同型)。 */
    onchange?: (value: string) => void;
    label: Snippet;
    description?: Snippet;
    error?: Snippet;
    start?: Snippet;
    end?: Snippet;
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
    onchange,
    label,
    description,
    error,
    start,
    end,
  }: Props = $props();

  const uid = $props.id();
  const inputId = `${uid}-input`;
  const descriptionId = `${uid}-description`;
  const errorId = `${uid}-error`;

  // readonly は invalid と同時に成立しない(state.md §6: HTML が readonly を constraint validation
  // から除外する)。両方が宣言されたら warn して invalid を落とす(HOLES #14)
  const effectiveInvalid = $derived(readonly ? false : invalid);
  $effect(() => {
    if (readonly && invalid) {
      console.warn(
        '[stemcell] TextField: readonly と invalid は同時に成立しない(state.md §6)。invalid を無視する。',
      );
    }
  });

  // keyboard=email/url は native の type にも反映して format validation(:invalid / typeMismatch / 送信時の
  // 標準エラー)を無償で得る(憲法 第2条 / RFC 0010)。numeric/decimal は type=number のスピナーを避けるため
  // text に留め(TextField.md §1)、tel は format validation が無いので inputmode だけで足りる。
  const inputType = $derived(keyboard === 'email' ? 'email' : keyboard === 'url' ? 'url' : 'text');

  // description と error は両方が「説明」として届く(field.md §3。並置の裁定)
  const describedby = $derived(
    [description ? descriptionId : null, effectiveInvalid && error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined,
  );
</script>

<div class="sc-textfield" data-size={size} data-invalid={effectiveInvalid} data-disabled={disabled}>
  <label class="sc-textfield-label" for={inputId}>
    {@render label()}{#if required}<span class="sc-textfield-required" aria-hidden="true"
      >*</span
    >{/if}
  </label>
  <!-- start / end は Button と違い aria-hidden しない: 中に対話要素(クリアボタン等)が立ちうる(契約 slots.end) -->
  <div class="sc-textfield-control">
    {#if start}<span class="sc-textfield-start">{@render start()}</span>{/if}
    <!-- disabled / readonly / required / placeholder / autocomplete は native 属性(契約の mirrorsNativeAttr)。
         native の確定 change は light DOM を伝播しうるため止める(field.md §5 の Lit/Svelte 非対称。HOLES #13)。
         bubble 側の onchange では止まらない: Svelte 5 は change をルートへ委譲し、ハンドラが走る時点で
         イベントは祖先を通過済み(テストが RED で実証)。委譲されない capture 側で止める -->
    <input
      class="sc-textfield-input"
      id={inputId}
      type={inputType}
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
    />
    {#if end}<span class="sc-textfield-end">{@render end()}</span>{/if}
  </div>
  {#if description}<p class="sc-textfield-description" id={descriptionId}>
      {@render description()}
    </p>{/if}
  {#if effectiveInvalid && error}<p class="sc-textfield-error" id={errorId}>
      {@render error()}
    </p>{/if}
</div>
