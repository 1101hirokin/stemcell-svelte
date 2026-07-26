<script lang="ts">
  import './DatePicker.css';
  import { META } from './meta';
  import DateField from '../DateField/DateField.svelte';
  import Calendar from '../Calendar/Calendar.svelte';
  import Popover from '../Popover/Popover.svelte';
  import Icon from '../Icon/Icon.svelte';
  import { formatMonth, parseISO, today } from '../internal/date';
  import type { Snippet } from 'svelte';

  // 暦日をひとつ選ぶ(DatePicker.md)。打つ欄と開く暦を束ね、両者は同じ値を指す。
  // 暦が開いているかは器が内部で持つ(トリガーに従属する一時面。Menu / Select と同じ形)。
  interface Props {
    name?: string;
    value?: string;
    min?: string;
    max?: string;
    unavailable?: string[];
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
    required?: boolean;
    size?: (typeof META.props.size.values)[number];
    label: Snippet;
    /** 暦を開く操作の名前(絵だけの操作。DS は文言を持たない)。Icon / CircularLoader と同じく文字列で受ける。 */
    calendarLabel: string;
    description?: Snippet;
    error?: Snippet;
    onchange?: (value: string) => void;
  }
  let {
    name,
    value = $bindable(META.props.value.default),
    min,
    max,
    unavailable = META.props.unavailable.default,
    disabled = META.props.disabled.default,
    readonly = META.props.readonly.default,
    invalid = META.props.invalid.default,
    required = META.props.required.default,
    size = META.props.size.default,
    label,
    calendarLabel,
    description,
    error,
    onchange,
  }: Props = $props();

  let open = $state(false);
  let month = $state(formatMonth(parseISO(value) ?? today()));

  // 開くたびに、今の値の月から見せる(欄で打った日が暦に写る。契約 a11y の「同じ値を指す」)
  $effect(() => {
    if (!open) return;
    month = formatMonth(parseISO(value) ?? today());
  });

  const commit = (next: string) => {
    value = next;
    onchange?.(next);
  };
</script>

<div class="sc-datepicker" data-disabled={disabled}>
  <DateField
    {name}
    {value}
    {min}
    {max}
    {disabled}
    {readonly}
    {invalid}
    {required}
    {size}
    {label}
    {description}
    {error}
    onchange={commit}
  />

  <div class="sc-datepicker-trigger">
    <Popover bind:open>
      {#snippet anchor()}
        <button
          type="button"
          class="sc-datepicker-trigger-button"
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
        <div class="sc-datepicker-panel">
          <Calendar
            bind:month
            start={value}
            {min}
            {max}
            {unavailable}
            onselect={(day) => {
              commit(day);
              open = false;
            }}
          />
        </div>
      {/snippet}
    </Popover>
  </div>
</div>
