<script lang="ts">
  import './DateField.css';
  import { META } from './meta';
  import {
    compare, daysInMonth, formatISO, isReal, parseISO, segmentName, segmentOrder,
    type Day, type SegmentType,
  } from '../internal/date';
  import type { Snippet } from 'svelte';

  // 暦日を打ち込む欄(DateField.md)。桁(年・月・日)に分けて受け、桁ごとに増減できる。
  // 並びと桁の名前は地域から借りる(date.md §3)。DS はこれらの文字列を持たない。
  interface Props {
    name?: string;
    /** 暦日(ISO 8601 の日付)。空文字列は未入力。アプリが所有する。 */
    value?: string;
    /** 選べる下限・上限。矢印での増減はこの外へ出ない。 */
    min?: string;
    max?: string;
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
    required?: boolean;
    autocomplete?: string;
    size?: (typeof META.props.size.values)[number];
    label: Snippet;
    description?: Snippet;
    error?: Snippet;
    /** 値が日として成立したときに発火する(途中では出さない。DateField.md §2)。 */
    onchange?: (value: string) => void;
  }
  let {
    name,
    value = $bindable(META.props.value.default),
    min,
    max,
    disabled = META.props.disabled.default,
    readonly = META.props.readonly.default,
    invalid = META.props.invalid.default,
    required = META.props.required.default,
    autocomplete,
    size = META.props.size.default,
    label,
    description,
    error,
    onchange,
  }: Props = $props();

  const uid = $props.id();
  const labelId = `${uid}-label`;
  const descriptionId = `${uid}-description`;
  const errorId = `${uid}-error`;

  const order = segmentOrder();
  const names = { year: segmentName('year'), month: segmentName('month'), day: segmentName('day') };

  // 桁の値。未入力は undefined(空の欄と、0 という値は別物)
  let parts = $state<{ year?: number; month?: number; day?: number }>({});
  let typed = ''; // 打ちかけの数字。桁を移ると捨てる
  let root: HTMLElement | undefined = $state();

  // 外から値が変わったら桁へ写す(欄と暦が同じ値を指す。DatePicker が両方を束ねる)
  $effect(() => {
    const day = parseISO(value);
    parts = day ? { year: day.year, month: day.month, day: day.day } : {};
  });

  const bounds = (type: SegmentType) => {
    if (type === 'year') return { min: 1, max: 9999 };
    if (type === 'month') return { min: 1, max: 12 };
    return { min: 1, max: daysInMonth(parts.year ?? 2024, parts.month ?? 1) };
  };

  const complete = (p: typeof parts): Day | undefined => {
    if (p.year == null || p.month == null || p.day == null) return undefined;
    const day = { year: p.year, month: p.month, day: p.day };
    return isReal(day) ? day : undefined;
  };

  // 値が日として成立したときにだけ知らせる。全桁が空になったときは「消した」という意思なので空で知らせる
  const publish = () => {
    const day = complete(parts);
    const next = day ? formatISO(day) : parts.year == null && parts.month == null && parts.day == null ? '' : undefined;
    if (next === undefined || next === value) return;
    value = next;
    onchange?.(next);
  };

  const set = (type: SegmentType, n: number | undefined) => {
    parts = { ...parts, [type]: n };
    publish();
  };

  const step = (type: SegmentType, delta: number) => {
    const b = bounds(type);
    const current = parts[type] ?? (type === 'year' ? new Date().getFullYear() : b.min);
    let next = current + delta;
    if (next > b.max) next = b.min;
    if (next < b.min) next = b.max;
    // 下限・上限の外へは出ない(打ち込みは native と同じく通し、範囲の判定はアプリが持つ)
    const candidate = complete({ ...parts, [type]: next });
    const low = min ? parseISO(min) : undefined;
    const high = max ? parseISO(max) : undefined;
    if (candidate && low && compare(candidate, low) < 0) return;
    if (candidate && high && compare(candidate, high) > 0) return;
    set(type, next);
  };

  const move = (from: SegmentType, delta: number) => {
    const index = order.indexOf(from) + delta;
    const target = order[index];
    if (!target) return;
    typed = '';
    root?.querySelector<HTMLElement>(`[data-segment="${target}"]`)?.focus();
  };

  const onkeydown = (e: KeyboardEvent, type: SegmentType) => {
    if (disabled || readonly) return;
    // 論理方向。RTL では左右の意味が反転する(web-keys.rules.json の共通則)
    const rtl = root ? getComputedStyle(root).direction === 'rtl' : false;
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === 'ArrowUp') step(type, 1);
    else if (e.key === 'ArrowDown') step(type, -1);
    else if (e.key === forward) move(type, 1);
    else if (e.key === backward) move(type, -1);
    else if (e.key === 'Backspace' || e.key === 'Delete') {
      typed = '';
      set(type, undefined);
    } else if (/^\d$/.test(e.key)) {
      const b = bounds(type);
      const width = type === 'year' ? 4 : 2;
      const buffer = (typed + e.key).slice(-width);
      typed = buffer;
      const n = Number(buffer);
      set(type, Math.min(Math.max(n, 0) || b.min, b.max));
      // 桁が埋まったら次へ送る(native の欄と同じ手触り)
      if (buffer.length >= width || n * 10 > b.max) {
        typed = '';
        move(type, 1);
      }
    } else return;
    e.preventDefault();
  };

  const shown = (type: SegmentType) => {
    const n = parts[type];
    if (n == null) return type === 'year' ? 'YYYY' : type === 'month' ? 'MM' : 'DD';
    return type === 'year' ? String(n).padStart(4, '0') : String(n).padStart(2, '0');
  };

  const describedby = $derived(
    [description ? descriptionId : null, invalid && error ? errorId : null].filter(Boolean).join(' ') || undefined,
  );
</script>

<!-- 欄の解剖は field.md §2(名前・説明・エラー)。桁は spinbutton で、値と上下限が支援技術へ届く。
     根に role を書かないのは、活性化される要素ではないからである(役割は桁の側に立つ。契約 a11y)。
     name を持つときだけ隠し入力を置き、native の form 送信・FormData・reset に参加する(field.md §5)。 -->
<div class="sc-datefield" data-size={size} data-invalid={invalid} data-disabled={disabled}>
  <span class="sc-datefield-label" id={labelId}>
    {@render label()}{#if required}<span class="sc-datefield-required" aria-hidden="true">*</span>{/if}
  </span>

  <div
    class="sc-datefield-control"
    role="group"
    bind:this={root}
    aria-labelledby={labelId}
    aria-describedby={describedby}
    aria-disabled={disabled ? 'true' : undefined}
  >
    {#each order as type, i (type)}
      {@const b = bounds(type)}
      <span
        class="sc-datefield-segment"
        data-segment={type}
        data-empty={parts[type] == null}
        role="spinbutton"
        tabindex={disabled ? -1 : 0}
        aria-label={names[type]}
        aria-valuenow={parts[type]}
        aria-valuemin={b.min}
        aria-valuemax={b.max}
        aria-valuetext={parts[type] == null ? names[type] : `${parts[type]}`}
        aria-readonly={readonly ? 'true' : undefined}
        onkeydown={(e) => onkeydown(e, type)}
      >{shown(type)}</span>
      {#if i < order.length - 1}<span class="sc-datefield-separator" aria-hidden="true">/</span>{/if}
    {/each}
  </div>

  {#if name}
    <input type="hidden" {name} {value} autocomplete={autocomplete as never} />
  {/if}
  {#if description}
    <span class="sc-datefield-description" id={descriptionId}>{@render description()}</span>
  {/if}
  {#if invalid && error}
    <span class="sc-datefield-error" id={errorId}>{@render error()}</span>
  {/if}
</div>
