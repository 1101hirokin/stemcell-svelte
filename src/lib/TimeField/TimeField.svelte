<script lang="ts">
  import './TimeField.css';
  import { arrowKeys } from '../internal/direction';
  import { META, type TimeSegment } from './meta';
  import { showSegment, stepSegment, takeDigit } from '../internal/segments';
  import {
    dayPeriodNames, formatTime, from12Hour, parseTime, prefers12Hour, to12Hour, toMinutes, type Time,
  } from '../internal/time';
  import type { Snippet } from 'svelte';

  // 時刻を打ち込む欄(TimeField.md)。桁で受けるのは DateField と同型で、手触り(増減・打ち込み・送り)は
  // internal/segments が持つ。値は常に 24 時間の表記で、表示が 12 時間制でも変わらない。
  interface Props {
    name?: string;
    /** HH:mm(秒を出すときは HH:mm:ss)。空文字列は未入力。アプリが所有する。 */
    value?: string;
    min?: string;
    max?: string;
    /** 時間の刻み。auto は環境から借りる(date.md §3)。 */
    hourCycle?: (typeof META.props.hourCycle.values)[number];
    /** 秒の桁を出すか。 */
    seconds?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
    required?: boolean;
    size?: (typeof META.props.size.values)[number];
    /** 桁の名前(「時」「分」「秒」「午前・午後」)。DS は文言を持たない(i18n.md §1)。 */
    segmentLabels: { hour: string; minute: string; second?: string; dayPeriod?: string };
    label: Snippet;
    description?: Snippet;
    error?: Snippet;
    onchange?: (value: string) => void;
  }
  let {
    name,
    value = $bindable(META.props.value.default),
    min,
    max,
    hourCycle = META.props.hourCycle.default,
    seconds = META.props.seconds.default,
    disabled = META.props.disabled.default,
    readonly = META.props.readonly.default,
    invalid = META.props.invalid.default,
    required = META.props.required.default,
    size = META.props.size.default,
    segmentLabels,
    label,
    description,
    error,
    onchange,
  }: Props = $props();

  const uid = $props.id();
  const labelId = `${uid}-label`;
  const descriptionId = `${uid}-description`;
  const errorId = `${uid}-error`;

  // 12 時間制で出すかは、既定では環境から借りる(date.md §3)。消費者が上書きできる
  const hour12 = $derived(hourCycle === 'auto' ? prefers12Hour() : hourCycle === '12');
  const periods = dayPeriodNames();
  const order = $derived<TimeSegment[]>([
    'hour',
    'minute',
    ...(seconds ? (['second'] as const) : []),
    ...(hour12 ? (['dayPeriod'] as const) : []),
  ]);

  let parts = $state<{ hour?: number; minute?: number; second?: number }>({});
  // 打ちかけの数字と、それを打った桁。桁を移ると捨てる(焦点だけ移った場合も含む。
  // 覚えたままだと、隣の桁で「1」を打ったときに前の桁の数字と繋がってしまう)
  let typed = '';
  let typedFor: TimeSegment | undefined;
  let root: HTMLElement | undefined = $state();

  // 外から値が変わったら桁へ写す
  $effect(() => {
    const t = parseTime(value);
    parts = t ? { hour: t.hour, minute: t.minute, second: t.second } : {};
  });

  const bounds = (type: TimeSegment) => {
    if (type === 'hour') return hour12 ? { min: 1, max: 12 } : { min: 0, max: 23 };
    return { min: 0, max: 59 };
  };

  const complete = (p: typeof parts): Time | undefined =>
    p.hour == null || p.minute == null || (seconds && p.second == null)
      ? undefined
      : { hour: p.hour, minute: p.minute, second: p.second };

  // 時刻として成立したときにだけ知らせる。全桁が空になったときは「消した」という意思なので空で知らせる
  const publish = () => {
    const t = complete(parts);
    const empty = parts.hour == null && parts.minute == null && parts.second == null;
    const next = t ? formatTime(t, seconds) : empty ? '' : undefined;
    if (next === undefined || next === value) return;
    value = next;
    onchange?.(next);
  };

  const set = (type: Exclude<TimeSegment, 'dayPeriod'>, n: number | undefined) => {
    parts = { ...parts, [type]: n };
    publish();
  };

  // 表示は 12 時間制でも、値は 24 時間で持つ(表示の慣習と値の表現を分ける)
  const shownHour = $derived(parts.hour == null ? undefined : hour12 ? to12Hour(parts.hour) : parts.hour);
  const isPM = $derived(parts.hour != null && parts.hour >= 12);

  const withinRange = (t: Time | undefined) => {
    if (!t) return true;
    const low = min ? parseTime(min) : undefined;
    const high = max ? parseTime(max) : undefined;
    if (low && toMinutes(t) < toMinutes(low)) return false;
    if (high && toMinutes(t) > toMinutes(high)) return false;
    return true;
  };

  const setHourFromDisplay = (displayed: number) => {
    const next = hour12 ? from12Hour(displayed, isPM) : displayed;
    if (!withinRange(complete({ ...parts, hour: next }))) return;
    set('hour', next);
  };

  const togglePeriod = (toPM: boolean) => {
    if (parts.hour == null) return;
    const next = (parts.hour % 12) + (toPM ? 12 : 0);
    if (!withinRange(complete({ ...parts, hour: next }))) return;
    set('hour', next);
  };

  const step = (type: TimeSegment, delta: number) => {
    if (type === 'dayPeriod') {
      togglePeriod(!isPM);
      return;
    }
    const b = bounds(type);
    const current = type === 'hour' ? shownHour : parts[type];
    const next = stepSegment(current, delta, b, b.min);
    if (type === 'hour') setHourFromDisplay(next);
    else if (withinRange(complete({ ...parts, [type]: next }))) set(type, next);
  };

  const move = (from: TimeSegment, delta: number) => {
    const target = order[order.indexOf(from) + delta];
    if (!target) return;
    typed = '';
    typedFor = undefined;
    root?.querySelector<HTMLElement>(`[data-segment="${target}"]`)?.focus();
  };

  const clear = (type: TimeSegment) => {
    typed = '';
    if (type === 'dayPeriod') return; // 午前午後だけを消せない(時の値の一部である)
    set(type, undefined);
  };

  const onkeydown = (e: KeyboardEvent, type: TimeSegment) => {
    if (disabled || readonly) return;
    const { forward, backward } = arrowKeys(root);
    if (e.key === 'ArrowUp') step(type, 1);
    else if (e.key === 'ArrowDown') step(type, -1);
    else if (e.key === forward) move(type, 1);
    else if (e.key === backward) move(type, -1);
    else if (e.key === 'Backspace' || e.key === 'Delete') clear(type);
    else if (type === 'dayPeriod' && /^[ap]$/i.test(e.key)) togglePeriod(e.key.toLowerCase() === 'p');
    else if (/^\d$/.test(e.key)) return; // 数字は input で受ける
    else return;
    e.preventDefault();
  };

  const takeOne = (type: Exclude<TimeSegment, 'dayPeriod'>, digit: string) => {
    const taken = takeDigit(typedFor === type ? typed : '', digit, 2, bounds(type));
    typed = taken.typed;
    typedFor = type;
    if (type === 'hour') setHourFromDisplay(taken.value);
    else if (withinRange(complete({ ...parts, [type]: taken.value }))) set(type, taken.value);
    if (taken.advance) {
      typed = '';
      move(type, 1);
    }
  };

  const oninput = (e: Event, type: TimeSegment) => {
    const el = e.currentTarget as HTMLInputElement;
    const data = (e as InputEvent).data ?? '';
    const deleting = ((e as InputEvent).inputType ?? '').startsWith('delete');
    el.value = shown(type); // 表示は器が決める
    if (disabled || readonly) return;
    if (deleting) clear(type);
    else if (type === 'dayPeriod') {
      for (const ch of data) if (/^[ap]$/i.test(ch)) togglePeriod(ch.toLowerCase() === 'p');
    } else for (const ch of data) if (/\d/.test(ch)) takeOne(type, ch);
    select(el);
  };

  const select = (el: HTMLInputElement) => el.setSelectionRange(0, el.value.length);

  const shown = (type: TimeSegment) => {
    if (type === 'dayPeriod') return parts.hour == null ? periods.am : isPM ? periods.pm : periods.am;
    if (type === 'hour') return showSegment(shownHour, 2, 'hh');
    return showSegment(parts[type], 2, type === 'minute' ? 'mm' : 'ss');
  };

  const nameOf = (type: TimeSegment) =>
    type === 'hour'
      ? segmentLabels.hour
      : type === 'minute'
        ? segmentLabels.minute
        : type === 'second'
          ? (segmentLabels.second ?? segmentLabels.minute)
          : (segmentLabels.dayPeriod ?? segmentLabels.hour);

  const describedby = $derived(
    [description ? descriptionId : null, invalid && error ? errorId : null].filter(Boolean).join(' ') || undefined,
  );
</script>

<!-- 解剖は field.md §2。桁は打てる要素の spinbutton で、値と上下限が支援技術へ届く(DateField と同型)。
     午前・午後も桁である(選択の一覧にしない。移動も増減も同じ規則で済む)。 -->
<div class="sc-timefield" data-size={size} data-invalid={invalid} data-disabled={disabled}>
  <span class="sc-timefield-label" id={labelId}>
    {@render label()}{#if required}<span class="sc-timefield-required" aria-hidden="true">*</span>{/if}
  </span>
  <div
    class="sc-timefield-control"
    role="group"
    bind:this={root}
    aria-labelledby={labelId}
    aria-describedby={describedby}
    aria-disabled={disabled ? 'true' : undefined}
  >
    {#each order as type, i (type)}
      {@const b = bounds(type)}
      <input
        class="sc-timefield-segment"
        data-segment={type}
        data-empty={type === 'dayPeriod' ? parts.hour == null : parts[type] == null}
        type="text"
        role="spinbutton"
        inputmode={type === 'dayPeriod' ? 'text' : 'numeric'}
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
        size={type === 'dayPeriod' ? Math.max(periods.am.length, periods.pm.length) : 2}
        value={shown(type)}
        readonly={disabled || readonly}
        tabindex={disabled ? -1 : 0}
        aria-label={nameOf(type)}
        aria-valuenow={type === 'dayPeriod' ? undefined : parts[type]}
        aria-valuemin={type === 'dayPeriod' ? undefined : b.min}
        aria-valuemax={type === 'dayPeriod' ? undefined : b.max}
        aria-valuetext={type === 'dayPeriod'
          ? shown(type)
          : parts[type] == null
            ? nameOf(type)
            : `${type === 'hour' ? shownHour : parts[type]}`}
        aria-readonly={readonly ? 'true' : undefined}
        onkeydown={(e) => onkeydown(e, type)}
        oninput={(e) => oninput(e, type)}
        onfocus={(e) => select(e.currentTarget)}
      />
      {#if i < order.length - 1 && order[i + 1] !== 'dayPeriod'}
        <span class="sc-timefield-separator" aria-hidden="true">:</span>
      {/if}
    {/each}
  </div>

  {#if name}<input type="hidden" {name} {value} />{/if}
  {#if description}<span class="sc-timefield-description" id={descriptionId}>{@render description()}</span>{/if}
  {#if invalid && error}<span class="sc-timefield-error" id={errorId}>{@render error()}</span>{/if}
</div>
