<script lang="ts">
  import './Calendar.css';
  import { META } from './meta';
  import IconButton from '../IconButton/IconButton.svelte';
  import Icon from '../Icon/Icon.svelte';
  import { tick } from 'svelte';
  import {
    addDays, addMonths, compare, formatISO, formatMonth, isBetween, isSame, monthGrid, monthLabel,
    parseISO, parseMonth, today, weekStart, weekdayNames, type Day,
  } from '../internal/date';

  // 月の格子(Calendar.md)。選択の意味を持たない: 今どこが選ばれているかを受け取り、押された日を返す。
  // 何を選択と見なすかは束ねる側(DatePicker / DateRangePicker)が決める。
  interface Props {
    /** 表示している月(YYYY-MM)。アプリが所有する値。 */
    month: string;
    /** 並べて見せる月数。 */
    months?: number;
    /** 選ばれている日、または期間の始まり。 */
    start?: string;
    /** 期間の終わり。start と併せて与えると、その間が範囲になる。 */
    end?: string;
    /** 選べる下限・上限。 */
    min?: string;
    max?: string;
    /** 個別に選べない日(表示している範囲のぶんでよい)。 */
    unavailable?: string[];
    /** 日が押された(意味づけは束ねる側)。 */
    onselect?: (value: string) => void;
    /** 表示する月の移動の要求。 */
    onmonthchange?: (month: string) => void;
  }
  let {
    month = $bindable(),
    months = META.props.months.default,
    start,
    end,
    min,
    max,
    unavailable = META.props.unavailable.default,
    onselect,
    onmonthchange,
  }: Props = $props();

  const uid = $props.id();
  const first = $derived(parseMonth(month) ?? { year: today().year, month: today().month });
  const startDay = $derived(start ? parseISO(start) : undefined);
  const endDay = $derived(end ? parseISO(end) : undefined);
  const minDay = $derived(min ? parseISO(min) : undefined);
  const maxDay = $derived(max ? parseISO(max) : undefined);
  const blocked = $derived(new Set(unavailable));
  const ws = weekStart();
  const weekdays = weekdayNames(ws);
  const now = today();

  // 焦点は格子の中に1つだけ載る(roving tabindex)。値とは別に持つ: 移動は選択ではない
  let focused = $state<Day | undefined>();
  const focus = $derived(focused ?? startDay ?? { ...first, day: 1 });
  let root: HTMLElement | undefined = $state();

  const visible = $derived(
    Array.from({ length: Math.max(1, months) }, (_, i) => {
      const m = addMonths({ ...first, day: 1 }, i);
      return { year: m.year, month: m.month };
    }),
  );

  const selectable = (day: Day) =>
    !(minDay && compare(day, minDay) < 0) &&
    !(maxDay && compare(day, maxDay) > 0) &&
    !blocked.has(formatISO(day));

  // 指を置いた日(無ければ焦点の日)。下限だけ置いた途中の予告に使う
  let hovered = $state<Day | undefined>();
  // 帯の範囲。対が揃っていれば対そのもの、下限だけ置いた途中は「今押せばここまで」を予告する。
  // 下限より前は予告しない: そこを押すと期間にならず、下限が置き直されるだけだから(DateRangePicker.md)
  const bandTo = $derived.by(() => {
    if (endDay) return endDay;
    const to = hovered ?? focused;
    return startDay && to && compare(to, startDay) > 0 ? to : undefined;
  });
  const inBand = (day: Day) => !!startDay && !!bandTo && isBetween(day, startDay, bandTo);
  // 選ばれているのは対だけである。予告は帯にしか出さない(aria-selected は対に従う)
  const inRange = (day: Day) =>
    !!startDay && !!endDay && isBetween(day, startDay, endDay);

  const select = (day: Day) => {
    if (!selectable(day)) return;
    focused = day;
    onselect?.(formatISO(day));
  };

  const show = (target: { year: number; month: number }) => {
    const next = formatMonth(target);
    if (next === month) return;
    month = next;
    onmonthchange?.(next);
  };

  // 焦点が見えている範囲の外へ出たら、その日が入る月まで表示を送る
  const moveFocus = async (day: Day) => {
    focused = day;
    const last = visible.at(-1)!;
    const before = compare(day, { ...visible[0]!, day: 1 }) < 0;
    const after = compare(day, { year: last.year, month: last.month, day: 28 }) > 0 &&
      (day.year > last.year || (day.year === last.year && day.month > last.month));
    if (before) show({ year: day.year, month: day.month });
    else if (after) show(addMonths({ year: day.year, month: day.month, day: 1 }, -(months - 1)));
    await tick();
    root?.querySelector<HTMLElement>('[data-focused="true"]')?.focus();
  };

  const onkeydown = async (e: KeyboardEvent, day: Day) => {
    // 論理方向。RTL では左右の意味が反転する
    const rtl = root ? getComputedStyle(root).direction === 'rtl' : false;
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === forward) await moveFocus(addDays(day, 1));
    else if (e.key === backward) await moveFocus(addDays(day, -1));
    else if (e.key === 'ArrowDown') await moveFocus(addDays(day, 7));
    else if (e.key === 'ArrowUp') await moveFocus(addDays(day, -7));
    else if (e.key === 'Home') await moveFocus(addDays(day, -(((new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay() - ws) + 7) % 7)));
    else if (e.key === 'End') await moveFocus(addDays(day, 6 - (((new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay() - ws) + 7) % 7)));
    else if (e.key === 'PageUp') await moveFocus(addMonths(day, e.shiftKey ? -12 : -1));
    else if (e.key === 'PageDown') await moveFocus(addMonths(day, e.shiftKey ? 12 : 1));
    else if (e.key === 'Enter' || e.key === ' ') select(day);
    else return;
    e.preventDefault();
  };
</script>

<!-- 格子は grid。列に曜日の見出しが付き、焦点は中に1つだけ載る(roving tabindex)。
     移動は選択ではないので、日は Enter / Space で選ぶ(web-keys.rules.json)。
     前後の月へ動かすボタンの名前は行き先の月そのものにする: DS は「前の月」という文言を持たない
     (i18n.md §1 の外側。月名は環境が答える)。 -->
<div class="sc-calendar" bind:this={root} style:--sc-calendar-months={Math.max(1, months)}>
  <div class="sc-calendar-nav">
    <IconButton
      label={monthLabel(addMonths({ ...first, day: 1 }, -1).year, addMonths({ ...first, day: 1 }, -1).month)}
      variant="text"
      color="plain"
      size="sm"
      onclick={() => show(addMonths({ ...first, day: 1 }, -1))}
    >
      <Icon name="chevron.left" />
    </IconButton>
    <div class="sc-calendar-spacer"></div>
    <IconButton
      label={monthLabel(addMonths({ ...first, day: 1 }, 1).year, addMonths({ ...first, day: 1 }, 1).month)}
      variant="text"
      color="plain"
      size="sm"
      onclick={() => show(addMonths({ ...first, day: 1 }, 1))}
    >
      <Icon name="chevron.right" />
    </IconButton>
  </div>

  <!-- 格子から指が出たら予告の相手を落とす(焦点の日での予告に戻る)。この器は操作要素ではなく、
       指の位置を予告の塗りへ渡すだけなので role を持たない -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="sc-calendar-grids" onpointerleave={() => (hovered = undefined)}>
    {#each visible as m (formatMonth(m))}
      <table class="sc-calendar-grid" role="grid" aria-label={monthLabel(m.year, m.month)}>
        <!-- 月の見出しは格子ごとに持つ。並べた月が狭い画面で縦へ折れても、見出しと格子がずれない -->
        <caption class="sc-calendar-month-label">{monthLabel(m.year, m.month)}</caption>
        <thead>
          <tr>
            {#each weekdays as w (w.long)}
              <th scope="col" abbr={w.long}><span aria-hidden="true">{w.short}</span></th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each monthGrid(m.year, m.month, ws) as week, i (i)}
            <tr>
              {#each week as day, j (j)}
                {#if day}
                  {@const iso = formatISO(day)}
                  {@const usable = selectable(day)}
                  <td
                    role="gridcell"
                    id={`${uid}-${iso}`}
                    class="sc-calendar-day"
                    tabindex={isSame(day, focus) ? 0 : -1}
                    data-focused={isSame(day, focus)}
                    data-selected={isSame(day, startDay) || isSame(day, endDay)}
                    data-band={inBand(day)}
                    data-band-start={inBand(day) && isSame(day, startDay)}
                    data-band-end={inBand(day) && isSame(day, bandTo)}
                    data-today={isSame(day, now)}
                    aria-selected={isSame(day, startDay) || isSame(day, endDay) || inRange(day)}
                    aria-current={isSame(day, now) ? 'date' : undefined}
                    aria-disabled={usable ? undefined : 'true'}
                    onclick={() => select(day)}
                    onkeydown={(e) => onkeydown(e, day)}
                    onpointerenter={() => (hovered = day)}
                  ><span class="sc-calendar-day-face">{day.day}</span></td>
                {:else}
                  <td class="sc-calendar-empty"></td>
                {/if}
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {/each}
  </div>
</div>
