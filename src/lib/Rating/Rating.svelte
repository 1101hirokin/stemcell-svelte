<script lang="ts">
  import './Rating.css';
  import '../internal/visually-hidden.css';
  import { META } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import type { Snippet } from 'svelte';

  // 段で表す評価(Rating.md)。WAI-ARIA に評価の型は無いので、既にある型を当てはめる。読み取りは一つの
  // 絵として名前つきで届き(role=img)、入力は段の集合から一つを選ぶ形で届く(native の radio の群)。
  // aria-readonly を足した集合にはしない: 読むだけの星に「グループ、ラジオ 5 個」を聞かせるのは冗長。
  interface Props {
    value?: number | null;
    max?: number;
    readonly?: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    name?: string;
    /** 取り消しを許すか。許すときは鍵盤にも道が要る(radio の群は鍵盤で選択を外せない。SC 2.1.1)。 */
    allowClear?: boolean;
    /** 名前を視覚から隠す(支援技術には届く)。周りが既に何の評価かを語っている場所で使う。 */
    labelHidden?: boolean;
    /** 読み取りのときの名前(「5 段階中 4.2」)。 */
    valueLabel?: string;
    /** 入力のときの各段の名前。max と同じ数だけ並べる。 */
    itemLabels?: string[];
    onchange?: (value: number | null) => void;
    label: Snippet;
    description?: Snippet;
    error?: Snippet;
  }
  let {
    value = $bindable<number | null>(null),
    max = META.props.max.default,
    readonly = META.props.readonly.default,
    disabled = META.props.disabled.default,
    required = META.props.required.default,
    invalid = META.props.invalid.default,
    name,
    allowClear = META.props.allowClear.default,
    labelHidden = META.props.labelHidden.default,
    valueLabel,
    itemLabels,
    onchange,
    label,
    description,
    error,
  }: Props = $props();

  const uid = $props.id();
  const groupName = $derived(name ?? `${uid}-rating`);
  const labelId = `${uid}-label`;
  const descriptionId = `${uid}-description`;
  const errorId = `${uid}-error`;

  const steps = $derived(Array.from({ length: max }, (_, i) => i + 1));
  // 読み取りは連続でよい(平均点を整数へ丸めると嘘になる)。入力は整数だけを採る
  const filled = $derived(Math.max(0, Math.min(max, value ?? 0)));
  // 割合は小数第一位まで(浮動小数の尾を CSS へ流さない)
  const ratio = (n: number) => (max > 0 ? Math.round((n / max) * 1000) / 10 : 0);
  const fillRatio = $derived(ratio(filled));

  // 撫でただけの予告は視覚にとどめる(読み上げに流さない。SC 4.1.3)
  let preview = $state<number | null>(null);
  const shownRatio = $derived(preview != null ? ratio(preview) : fillRatio);

  const effectiveInvalid = $derived(readonly ? false : invalid);
  $effect(() => {
    if (readonly && invalid) {
      console.warn('[stemcell] Rating: readonly と invalid は同時に成立しない(field.md §5)。invalid を無視する。');
    }
    if (readonly && !valueLabel) {
      console.warn(
        '[stemcell] Rating: readonly のときは valueLabel が要る(Rating.md §2)。' +
          '絵として届く部品に名前が無いと、評価そのものが読み上げに乗らない。',
      );
    }
    if (!readonly && (itemLabels?.length ?? 0) !== max) {
      console.warn(
        `[stemcell] Rating: 入力のときは itemLabels を max(${max})と同じ数だけ渡す(Rating.md §2)。` +
          '数字だけの名前では、何段階中のいくつかが読み上げで分からない。',
      );
    }
  });

  const pick = (step: number) => {
    const next = allowClear && value === step ? null : step;
    value = next;
    onchange?.(next);
  };
  // 取り消しは鍵盤からも届く(押し直しだけにするとポインタ専用の機能になる。SC 2.1.1)
  const onkeydown = (e: KeyboardEvent) => {
    if (!allowClear || readonly || disabled) return;
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    e.preventDefault();
    value = null;
    onchange?.(null);
  };
</script>

{#if readonly}
  <!-- 読むだけの星はフォーム部品ではない。一つの絵として名前つきで届き、星は支援技術から外す -->
  <div class="sc-rating" data-readonly="true" data-label-hidden={labelHidden}>
    <span class="sc-rating-label" class:sc-visually-hidden={labelHidden} id={labelId}>{@render label()}</span>
    <div class="sc-rating-stars" role="img" aria-label={valueLabel} style:--sc-rating-fill="{fillRatio}%">
      <div class="sc-rating-track" aria-hidden="true">
        {#each steps as step (step)}<span class="sc-rating-star"><Icon name="star" /></span>{/each}
      </div>
      <div class="sc-rating-fill" aria-hidden="true">
        {#each steps as step (step)}<span class="sc-rating-star"><Icon name="star.fill" /></span>{/each}
      </div>
    </div>
  </div>
{:else}
  <!-- 付ける星は段の集合から一つを選ぶ。native の radio で組めば ARIA を足さずに済む(第2条)。
       矢印キーと roving tabindex は native が持つ(RadioGroup と同じ) -->
  <fieldset
    class="sc-rating"
    role="radiogroup"
    data-label-hidden={labelHidden}
    data-invalid={effectiveInvalid}
    data-disabled={disabled}
    {disabled}
    aria-labelledby={labelId}
    aria-describedby={[description ? descriptionId : null, effectiveInvalid && error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined}
    aria-invalid={effectiveInvalid ? 'true' : undefined}
    aria-required={required ? 'true' : undefined}
    {onkeydown}
    onmouseleave={() => (preview = null)}
  >
    <legend class="sc-rating-label" id={labelId}>
      {@render label()}{#if required}<span class="sc-rating-required" aria-hidden="true">*</span>{/if}
    </legend>
    <div class="sc-rating-stars" style:--sc-rating-fill="{shownRatio}%">
      {#each steps as step (step)}
        <label
          class="sc-rating-step"
          data-filled={step <= (preview ?? filled) || undefined}
          onmouseenter={() => (preview = step)}
        >
          <input
            class="sc-rating-input"
            type="radio"
            name={groupName}
            value={step}
            checked={value === step}
            {disabled}
            {required}
            onclick={() => pick(step)}
            onfocus={() => (preview = step)}
            onblur={() => (preview = null)}
          />
          <span class="sc-rating-star" aria-hidden="true">
            <Icon name={step <= (preview ?? filled) ? 'star.fill' : 'star'} />
          </span>
          <span class="sc-rating-name sc-visually-hidden">{itemLabels?.[step - 1] ?? String(step)}</span>
        </label>
      {/each}
    </div>
    {#if description}<p class="sc-rating-description" id={descriptionId}>{@render description()}</p>{/if}
    {#if effectiveInvalid && error}<p class="sc-rating-error" id={errorId}>{@render error()}</p>{/if}
  </fieldset>
{/if}
