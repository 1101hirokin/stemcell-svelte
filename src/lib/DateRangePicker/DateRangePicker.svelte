<script lang="ts">
  import './DateRangePicker.css';
  import { META } from './meta';
  import DateField from '../DateField/DateField.svelte';
  import Calendar from '../Calendar/Calendar.svelte';
  import AnchoredPanel from '../internal/AnchoredPanel.svelte';
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
    /** 暦の面の先頭へ差し込む中身(期間の候補など)。省略すれば暦だけが出る(patterns/date-range.md §3)。 */
    panelLead?: Snippet;
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
    panelLead,
    description,
    error,
    onchange,
  }: Props = $props();

  const uid = $props.id();
  const labelId = `${uid}-label`;

  let open = $state(false);
  // 見えている月。開いた時点の始まりから始まり、以後は利用者のページ送りでしか動かない。
  // 選び直しで月が跳ぶと、隣の月を見比べている最中に視界がさらわれる(DateRangePicker.md)
  let month = $state(formatMonth(parseISO(start) ?? today()));
  // 次に押した日が終わりになる途中の状態。視覚と支援技術の両方へ届ける(契約 a11y)
  let pending = $state(false);

  const commit = (nextStart: string, nextEnd: string) => {
    start = nextStart;
    end = nextEnd;
    onchange?.({ start: nextStart, end: nextEnd });
  };

  // 格子は「この日が押された」しか返さない。意味づけはここが与える(Calendar.md §2)。
  // 対が揃っても閉じない: 期間は「選んで終わり」ではなく、両端を見比べながら詰める操作である。
  // 選び直しで押した日は必ず期間の下限になる(内も外も区別しない。対の端そのものを押したときだけ変えない)。
  // 下限だけ置いた途中に下限より前を押したときも、対を入れ替えずに下限を置き直す。
  // 閉じるのは明示の退出(Escape・外側の押下)で、それは合成した面(AnchoredPanel)が持つ。
  // 狭い画面ではその面が modal 類(下端のシート)へ移る(RFC 0017 / overlay.md §5)。

  const onselect = (value: string) => {
    const day = parseISO(value);
    if (!day) return;
    const from = parseISO(start);
    // 途中(下限だけ置いた)。下限より後を押せば対が揃う
    if (pending && from && compare(day, from) >= 0) {
      pending = false;
      return commit(start, value);
    }
    // 対の端そのものは変えない(押し間違いで期間を失わせない)
    if (!pending && (value === start || value === end)) return;
    // 押した日は必ず下限になる。途中に下限より前を押したときも、対を入れ替えずにそこへ置き直す
    pending = true;
    commit(value, '');
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

    {#snippet trigger()}
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
    {#snippet panel()}
      <!-- 面の先頭に差し込む中身(候補の列など)。部品は中身を解釈しない。狭い画面では暦の上へ回る
           (行の始まり側に置く場所が無い。patterns/date-range.md §3) -->
      <div class="sc-daterangepicker-panel" aria-live="polite">
        {#if panelLead}<div class="sc-daterangepicker-panel-lead">{@render panelLead()}</div>{/if}
        <Calendar bind:month months={2} {start} {end} {min} {max} {unavailable} {onselect} />
      </div>
    {/snippet}

    <div class="sc-daterangepicker-trigger">
      <AnchoredPanel bind:open title={label} {trigger} content={panel} />
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
