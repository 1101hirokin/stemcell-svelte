<script lang="ts">
  import './TextField.css';
  import { META } from './meta';
  import ClearButton from '../internal/ClearButton.svelte';
  import type { Snippet } from 'svelte';
  import type { FullAutoFill } from 'svelte/elements';

  interface Props {
    /** フォーム名(native の <form> 送信・FormData・reset に参加。field.md §5)。 */
    name?: string;
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    /** 値をまとめて消す操作を出す(検索欄はこれで組む。TextField.md §2)。値があるときだけ現れる。 */
    clearable?: boolean;
    /** 消す操作の名前(「消去」)。clearable が真のときに要る。DS は文言を持たない(i18n.md §1)。 */
    clearLabel?: string;
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
    clearable = META.props.clearable.default,
    clearLabel,
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

  let inputEl: HTMLInputElement | undefined = $state();

  // 消す操作は値があるときだけ出す(空の欄に押せない印を残さない)。打てない欄では出さない
  const showClear = $derived(clearable && value !== '' && !disabled && !readonly);
  $effect(() => {
    if (clearable && !clearLabel) {
      console.warn('[stemcell] TextField: clearable には clearLabel が要る(絵だけの操作は名前を持つ。field.md §2)。');
    }
  });
  const clear = () => {
    if (!showClear) return;
    value = '';
    onchange?.('');
    inputEl?.focus(); // 消すのは打ち直すためなので、焦点は欄に残す
  };
  // Escape で消す(RFC 0021)。値があるときだけ消してそこで止め、空なら外へ抜く
  // (面の中の欄で、面が閉じなくなるのを避ける)
  const onkeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !showClear) return;
    e.preventDefault();
    e.stopPropagation();
    clear();
  };

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
      bind:this={inputEl}
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
      {onkeydown}
    />
    <!-- 消す操作は end の中身より内側(欄寄り)に立つ。消すのは値に対する操作なので値の近くにいる。
         タブ順には入る(native の type=search が描く × は鍵盤から触れないので引き継がない) -->
    {#if showClear}<ClearButton label={clearLabel} onclear={clear} />{/if}
    {#if end}<span class="sc-textfield-end">{@render end()}</span>{/if}
  </div>
  {#if description}<p class="sc-textfield-description" id={descriptionId}>
      {@render description()}
    </p>{/if}
  {#if effectiveInvalid && error}<p class="sc-textfield-error" id={errorId}>
      {@render error()}
    </p>{/if}
</div>
