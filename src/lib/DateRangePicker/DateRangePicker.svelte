<script lang="ts">
  import './DateRangePicker.css';
  import { META } from './meta';
  import DateField from '../DateField/DateField.svelte';
  import Calendar from '../Calendar/Calendar.svelte';
  import Popover from '../Popover/Popover.svelte';
  import Icon from '../Icon/Icon.svelte';
  import { compare, formatMonth, parseISO, today } from '../internal/date';
  import type { Snippet } from 'svelte';

  // 期間を選ぶ(DateRangePicker.md)。始まりと終わりで1つの期間であって、2つの独立した日付ではない。
  interface Props {
    name?: string;
    start?: string;
    end?: string;
    min?: string;
    max?: string;
    unavailable?: string[];
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
    required?: boolean;
    size?: (typeof META.props.size.values)[number];
    /** 期間全体の名前。 */
    label: Snippet;
    /** 始まりと終わりの欄の名前(欄はそれぞれ名前を持つ。field.md §2)。 */
    startLabel: Snippet;
    endLabel: Snippet;
    /** 暦を開く操作の名前。 */
    calendarLabel: string;
    description?: Snippet;
    error?: Snippet;
    /** 期間が変わった。始まりと終わりを対で渡す。 */
    onchange?: (range: { start: string; end: string }) => void;
  }
  let {
    name,
    start = $bindable(META.props.start.default),
    end = $bindable(META.props.end.default),
    min,
    max,
    unavailable = META.props.unavailable.default,
    disabled = META.props.disabled.default,
    readonly = META.props.readonly.default,
    invalid = META.props.invalid.default,
    required = META.props.required.default,
    size = META.props.size.default,
    label,
    startLabel,
    endLabel,
    calendarLabel,
    description,
    error,
    onchange,
  }: Props = $props();

  const uid = $props.id();
  const labelId = `${uid}-label`;

  let open = $state(false);
  let month = $state(formatMonth(parseISO(start) ?? today()));
  // 次に押した日が終わりになる途中の状態。視覚と支援技術の両方へ届ける(契約 a11y)
  let pending = $state(false);

  $effect(() => {
    if (!open) return;
    month = formatMonth(parseISO(start) ?? today());
  });

  const commit = (nextStart: string, nextEnd: string) => {
    start = nextStart;
    end = nextEnd;
    onchange?.({ start: nextStart, end: nextEnd });
  };

  // 格子は「この日が押された」しか返さない。意味づけはここが与える(Calendar.md §2)。
  // 対が揃っても閉じない: 期間は「選んで終わり」ではなく、両端を見比べながら詰める操作である。
  // 揃った後にもう一度押したら、そこから新しい期間を取り直す(業界の常態)。閉じるのは
  // 明示の退出(Escape・外側の押下)で、それは合成した Popover が持つ。
  const onselect = (value: string) => {
    const day = parseISO(value);
    if (!day) return;
    const from = parseISO(start);
    if (!pending || !from) {
      pending = true;
      commit(value, '');
      return;
    }
    pending = false;
    // 終わりが始まりより前なら対を入れ替える(黙って不正な対を保持しない。契約 a11y)
    if (compare(day, from) < 0) commit(value, start);
    else commit(start, value);
  };
</script>

<!-- 2つの欄が1つの期間であることを group と全体の名前で届ける(契約 a11y)。 -->
<div class="sc-daterangepicker" role="group" aria-labelledby={labelId} data-disabled={disabled}>
  <span class="sc-daterangepicker-label" id={labelId}>{@render label()}</span>

  <div class="sc-daterangepicker-fields">
    <DateField
      value={start}
      {min}
      max={end || max}
      {disabled}
      {readonly}
      {invalid}
      {required}
      {size}
      label={startLabel}
      onchange={(v) => commit(v, end)}
    />
    <DateField
      value={end}
      min={start || min}
      {max}
      {disabled}
      {readonly}
      {invalid}
      {size}
      label={endLabel}
      onchange={(v) => commit(start, v)}
    />

    <div class="sc-daterangepicker-trigger">
      <Popover bind:open>
        {#snippet anchor()}
          <button
          type="button"
          class="sc-daterangepicker-trigger-button"
          aria-label={calendarLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={disabled || readonly}
          onclick={() => (open = !open)}
        >
          <Icon name="calender" />
        </button>
        {/snippet}
        {#snippet content()}
          <div class="sc-daterangepicker-panel" aria-live="polite">
            <Calendar
              bind:month
              months={2}
              {start}
              {end}
              {min}
              {max}
              {unavailable}
              {onselect}
            />
          </div>
        {/snippet}
      </Popover>
    </div>
  </div>

  {#if name}
    <input type="hidden" name={`${name}-start`} value={start} />
    <input type="hidden" name={`${name}-end`} value={end} />
  {/if}
  {#if description}
    <span class="sc-daterangepicker-description">{@render description()}</span>
  {/if}
  {#if invalid && error}
    <span class="sc-daterangepicker-error">{@render error()}</span>
  {/if}
</div>
