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
  // 暦の押下がどちらの端を動かすか。直近に動かした端が残る(欄を打てばその欄の側へ移る)
  let edge = $state<'start' | 'end'>('end');

  $effect(() => {
    if (!open) return;
    month = formatMonth(parseISO(start) ?? today());
  });

  const commit = (nextStart: string, nextEnd: string, moved: 'start' | 'end' = edge) => {
    start = nextStart;
    end = nextEnd;
    edge = moved;
    onchange?.({ start: nextStart, end: nextEnd });
  };

  // 格子は「この日が押された」しか返さない。意味づけはここが与える(Calendar.md §2)。
  // 対が揃っても閉じない: 期間は「選んで終わり」ではなく、両端を見比べながら詰める操作である。
  // 揃った後の押下は、伸ばすのも縮めるのも同じ一つの規則で受ける: 押した日を「直近に動かした端」へ
  // 置き、それだと対が反転する押下では反対の端へ置く。始まりだけ置いた途中の状態も、対を
  // [始まり, 始まり] とみなせば同じ規則になる。閉じるのは明示の退出(Escape・外側の押下)で、
  // それは合成した Popover が持つ。DateRangePicker.md。
  const onselect = (value: string) => {
    const day = parseISO(value);
    if (!day) return;
    const from = parseISO(start);
    if (!from) {
      pending = true;
      return commit(value, '', 'start');
    }
    const closing = pending || !end; // 次の押下で対が揃う(= 対を [始まり, 始まり] とみなす)
    const to = closing ? from : parseISO(end)!;
    const active = closing ? 'end' : edge;
    // 直近に動かした端へ置く。ただし対が反転する押下(始まりより前 / 終わりより後)では反対の端へ
    const inverts = active === 'end' ? compare(day, from) < 0 : compare(day, to) > 0;
    const moved = inverts ? (active === 'end' ? 'start' : 'end') : active;
    pending = false;
    if (moved === 'start') commit(value, closing ? start : end, 'start');
    else commit(start, value, 'end');
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
      onchange={(v) => commit(v, end, 'start')}
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
      onchange={(v) => commit(start, v, 'end')}
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
          <Icon name="calendar" />
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
