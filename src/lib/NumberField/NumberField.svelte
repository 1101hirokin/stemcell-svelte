<script lang="ts">
  import './NumberField.css';
  import { META } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import type { Snippet } from 'svelte';
  import type { FullAutoFill } from 'svelte/elements';

  // 数を打つ欄(NumberField.md)。native の <input type="number"> は採らない: スピナーの見た目は
  // ブラウザ任せで指には小さく、焦点があるときのホイールで値が書き換わり、iOS で桁の扱いに難があり、
  // GOV.UK が調査に基づいて type=number をやめている。打てる欄に数の意味論(spinbutton)を載せ、
  // 失う能力(フォーム参加)は隠しの欄で補う(Select の pointer 経路と同じ形。第2条)。
  interface Props {
    name?: string;
    /** いまの値。空(未入力)は null で、0 ではない。 */
    value?: number | null;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
    required?: boolean;
    autocomplete?: string;
    keyboard?: (typeof META.props.keyboard.values)[number];
    size?: (typeof META.props.size.values)[number];
    /** 増やす操作の名前(絵だけの操作)。 */
    incrementLabel: string;
    /** 減らす操作の名前。 */
    decrementLabel: string;
    /** 契約の change(逐次。payload は新しい値。空なら null)。 */
    onchange?: (value: number | null) => void;
    label: Snippet;
    description?: Snippet;
    error?: Snippet;
  }
  let {
    name,
    value = $bindable<number | null>(null),
    min,
    max,
    step = META.props.step.default,
    placeholder,
    disabled = META.props.disabled.default,
    readonly = META.props.readonly.default,
    invalid = META.props.invalid.default,
    required = META.props.required.default,
    autocomplete,
    keyboard = META.props.keyboard.default,
    size = META.props.size.default,
    incrementLabel,
    decrementLabel,
    onchange,
    label,
    description,
    error,
  }: Props = $props();

  const uid = $props.id();
  const inputId = `${uid}-input`;
  const descriptionId = `${uid}-description`;
  const errorId = `${uid}-error`;

  // readonly は invalid と同時に成立しない(state.md §6。TextField と同じ扱い。HOLES #14)
  const effectiveInvalid = $derived(readonly ? false : invalid);
  $effect(() => {
    if (readonly && invalid) {
      console.warn(
        '[stemcell] NumberField: readonly と invalid は同時に成立しない(state.md §6)。invalid を無視する。',
      );
    }
  });

  // 打っている最中の文字はそのまま残す。値に直せない途中の入力(「-」「1.」)で欄を書き換えない
  let typed = $state<string | null>(null);
  const shown = $derived(typed ?? (value == null ? '' : String(value)));

  const clamp = (n: number) => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  // 刻みの倍数からずれた値を打っている最中に器が書き換えない(確定の時機は検証の関心。field.md §5)。
  // 動かすときだけ刻みに乗せる。浮動小数の誤差は桁を揃えてから丸める
  const stepped = (from: number, by: number) => {
    const decimals = (String(step).split('.')[1] ?? '').length;
    return Number((from + by).toFixed(decimals));
  };
  const commit = (next: number | null) => {
    typed = null;
    value = next;
    onchange?.(next);
  };
  const nudge = (direction: 1 | -1, factor = 1) => {
    if (disabled || readonly) return;
    const from = value ?? (min ?? 0);
    commit(clamp(value == null ? from : stepped(from, step * factor * direction)));
  };

  const oninput = (e: Event & { currentTarget: HTMLInputElement }) => {
    const raw = e.currentTarget.value;
    typed = raw;
    if (raw.trim() === '') {
      value = null;
      onchange?.(null);
      return;
    }
    const n = Number(raw);
    if (Number.isNaN(n)) return; // 途中の入力(「-」「1.」)は値にしない
    value = n;
    onchange?.(n);
  };

  // 上で増え、下で減る。PageUp / PageDown は大きく動かす(倍率は実装の判断)。
  // Home / End は割り当てない: 打てる欄なので文字の移動に残す(RFC 0019)
  const onkeydown = (e: KeyboardEvent) => {
    const factor = e.key === 'PageUp' || e.key === 'PageDown' ? 10 : 1;
    const direction = e.key === 'ArrowUp' || e.key === 'PageUp' ? 1 : e.key === 'ArrowDown' || e.key === 'PageDown' ? -1 : 0;
    if (!direction) return;
    e.preventDefault();
    nudge(direction, factor);
  };

  const describedby = $derived(
    [description ? descriptionId : null, effectiveInvalid && error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined,
  );
  const atMin = $derived(min != null && value != null && value <= min);
  const atMax = $derived(max != null && value != null && value >= max);
</script>

<div class="sc-numberfield" data-size={size} data-invalid={effectiveInvalid} data-disabled={disabled}>
  <label class="sc-numberfield-label" for={inputId}>
    {@render label()}{#if required}<span class="sc-numberfield-required" aria-hidden="true">*</span>{/if}
  </label>
  <div class="sc-numberfield-control">
    <!-- 打てる欄に数の意味論を載せる。値と境界は spinbutton が伝える。
         ホイールは割り当てない: 送る操作と値を変える操作を同じ入力に重ねない(RFC 0019) -->
    <input
      class="sc-numberfield-input"
      id={inputId}
      type="text"
      role="spinbutton"
      inputmode={keyboard}
      value={shown}
      {placeholder}
      {disabled}
      {readonly}
      {required}
      autocomplete={autocomplete as FullAutoFill | undefined}
      aria-valuenow={value ?? undefined}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-invalid={effectiveInvalid ? 'true' : undefined}
      aria-describedby={describedby}
      {oninput}
      {onkeydown}
      onblur={() => (typed = null)}
      onchangecapture={(e) => e.stopPropagation()}
    />
    <!-- 増減はタブ順から外す(同じことが矢印キーでできる)。押せることは見えていなければならない。
         二つを隣り合わせるのは、続けて押すのに指と視線を往復させないためである。押下で焦点を
         奪わない(pointerdown を止める): 焦点が欄から外れると、続けて打てなくなる。横に並べるのは
         当たり判定で、縦に積むと欄の高さを二つで分け合って 24px を割る(実測 21px。size.md §4 /
         WCAG 2.2 SC 2.5.8) -->
    <button
      type="button"
      class="sc-numberfield-stepper"
      tabindex="-1"
      aria-label={decrementLabel}
      disabled={disabled || readonly || atMin}
      onpointerdown={(e) => e.preventDefault()}
      onclick={() => nudge(-1)}
    >
      <Icon name="arthmetic.minus" />
    </button>
    <button
      type="button"
      class="sc-numberfield-stepper"
      tabindex="-1"
      aria-label={incrementLabel}
      disabled={disabled || readonly || atMax}
      onpointerdown={(e) => e.preventDefault()}
      onclick={() => nudge(1)}
    >
      <Icon name="arthmetic.plus" />
    </button>
  </div>
  <!-- native の form 送信に参加する(打てる欄が type=text なので、値は隠しの欄が運ぶ。field.md §5) -->
  {#if name}<input type="hidden" {name} value={value ?? ''} />{/if}
  {#if description}<p class="sc-numberfield-description" id={descriptionId}>{@render description()}</p>{/if}
  {#if effectiveInvalid && error}<p class="sc-numberfield-error" id={errorId}>{@render error()}</p>{/if}
</div>
