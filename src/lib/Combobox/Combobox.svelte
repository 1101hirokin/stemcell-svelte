<script lang="ts">
  import './Combobox.css';
  import { META, type ComboboxOption } from './meta';
  import { enabledIndexes, initialActive, nextActive } from '../internal/listbox';
  import Icon from '../Icon/Icon.svelte';
  import Popover from '../Popover/Popover.svelte';
  import type { Snippet } from 'svelte';

  // 打ちながら候補を絞り、その中から一つ選ぶ欄(Combobox.md)。native の自動補完(<datalist>)は採らない
  // (拡大に追従せず、高コントラストに応答せず、NVDA と Firefox で候補が読み上げられない)。
  // 絞り込みは器が持たない: 打たれた文字を知らせるだけで、絞った候補は消費者が渡し直す。
  interface Props {
    name?: string;
    /** 選ばれている選択肢の識別子。打った文字はここに入らない。 */
    value?: string;
    /** いま出す候補。器は絞らず、この並びをそのまま出す。 */
    options: ComboboxOption[];
    /** 打たれている文字。アプリが値として持ちたい場合に渡す。 */
    inputValue?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
    required?: boolean;
    labelHidden?: boolean;
    size?: (typeof META.props.size.values)[number];
    /** 候補が一件も無いときに出す言葉。 */
    emptyLabel: string;
    /** 候補の件数を支援技術へ届ける文の型(「{n} 件」)。 */
    countLabel: string;
    /** 選ばれた選択肢が変わった。 */
    onchange?: (value: string) => void;
    /** 打たれている文字が変わった。消費者はこれを受けて候補を絞る。 */
    oninputchange?: (value: string) => void;
    label: Snippet;
    description?: Snippet;
    error?: Snippet;
  }
  let {
    name,
    value = $bindable(META.props.value.default),
    options,
    inputValue = $bindable(''),
    placeholder,
    disabled = META.props.disabled.default,
    readonly = META.props.readonly.default,
    invalid = META.props.invalid.default,
    required = META.props.required.default,
    labelHidden = META.props.labelHidden.default,
    size = META.props.size.default,
    emptyLabel,
    countLabel,
    onchange,
    oninputchange,
    label,
    description,
    error,
  }: Props = $props();

  const uid = $props.id();
  const inputId = `${uid}-input`;
  const listboxId = `${uid}-listbox`;
  const descriptionId = `${uid}-description`;
  const errorId = `${uid}-error`;
  const optId = (i: number) => `${uid}-opt-${i}`;

  const effectiveInvalid = $derived(readonly ? false : invalid);
  $effect(() => {
    if (readonly && invalid) {
      console.warn('[stemcell] Combobox: readonly と invalid は同時に成立しない(state.md §6)。invalid を無視する。');
    }
  });

  let open = $state(false);
  let activeIndex = $state(-1); // 仮想焦点。DOM の焦点は欄に留まる
  const selectedIndex = $derived(options.findIndex((o) => o.value === value));
  const selectedOption = $derived(options.find((o) => o.value === value));
  const enabled = $derived(enabledIndexes(options));

  // 選ばれている値の表示。絞り込みで候補から外れても、選んだ相手の名前は器が覚えている
  // (候補は打つたびに入れ替わるので、そのときの並びに頼ると、戻す先を見失って欄が空になる)
  let selectedLabel = $state('');
  $effect(() => {
    if (!value) selectedLabel = '';
    else if (selectedOption) selectedLabel = selectedOption.label;
  });

  // 打った文字は値ではない。閉じたときも焦点が外れたときも、選ばれている値の表示へ戻す
  const shownText = $derived(value ? (selectedOption?.label ?? selectedLabel) : '');
  const revert = () => {
    if (inputValue === shownText) return;
    inputValue = shownText;
    oninputchange?.(shownText);
  };
  // 空にして欄の外を押したら、選択も外れる。欄が空なら「何も選んでいない」と読むのが自然で、
  // 選び直す手段が無いまま値だけ残ると、見えているものと送られるものが食い違う
  const clearSelection = () => {
    selectedLabel = '';
    if (inputValue !== '') {
      inputValue = '';
      oninputchange?.('');
    }
    if (!value) return;
    value = '';
    onchange?.('');
  };
  // 焦点が外れたときの後始末。空なら選択を外し、打ちかけなら選ばれている値の表示へ戻す
  const commit = () => (inputValue.trim() === '' ? clearSelection() : revert());

  const openList = () => {
    if (disabled || readonly) return;
    open = true;
    activeIndex = initialActive(options, selectedIndex);
  };
  const closeList = (opts: { commit?: boolean } = {}) => {
    open = false;
    activeIndex = -1;
    // 閉じ方で後始末が違う。Escape は取り消しなので、消した文字ごと元の表示へ戻す
    if (opts.commit) commit();
    else revert();
  };
  const selectAt = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    value = o.value;
    selectedLabel = o.label;
    onchange?.(o.value);
    inputValue = o.label;
    oninputchange?.(o.label);
    open = false;
    activeIndex = -1;
  };

  const oninput = (e: Event & { currentTarget: HTMLInputElement }) => {
    inputValue = e.currentTarget.value;
    oninputchange?.(inputValue);
    // 打っている間は候補を先に選ばない(APG の manual selection)。打つたびに候補は入れ替わるので、
    // 仮の焦点を残すと、さっき指していた位置に別の選択肢が来て、Enter が見ていない相手を選ぶ
    open = !disabled && !readonly;
    activeIndex = -1;
  };

  const onkeydown = (e: KeyboardEvent) => {
    if (disabled || readonly) return;
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        activeIndex = nextActive(enabled, activeIndex, 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeIndex = nextActive(enabled, activeIndex, -1);
        break;
      case 'Home':
        e.preventDefault();
        activeIndex = enabled[0] ?? -1;
        break;
      case 'End':
        e.preventDefault();
        activeIndex = enabled.at(-1) ?? -1;
        break;
      case 'Enter':
        if (activeIndex >= 0) {
          e.preventDefault();
          selectAt(activeIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeList();
        break;
      case 'Tab':
        closeList({ commit: true }); // 送りで抜けるときも打った文字は残さない
        break;
    }
  };

  const describedby = $derived(
    [description ? descriptionId : null, effectiveInvalid && error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined,
  );
  // 候補の件数は器が知っているので器が告げる(0 件も件数である)
  const count = $derived(countLabel.replace('{n}', String(options.length)));
</script>

<div
  class="sc-combobox"
  data-size={size}
  data-invalid={effectiveInvalid}
  data-disabled={disabled}
  data-label-hidden={labelHidden}
>
  <label class="sc-combobox-label" id={`${uid}-label`} for={inputId}>
    {@render label()}{#if required}<span class="sc-combobox-required" aria-hidden="true">*</span>{/if}
  </label>
  <!-- 打てる欄自身が combobox である(ARIA 1.2)。焦点は欄に留まり、候補は aria-activedescendant が指す -->
  {#if name}<input type="hidden" {name} {value} />{/if}
  <Popover {open} onopenchange={(o) => (o ? openList() : closeList())}>
    {#snippet anchor()}
      <div class="sc-combobox-control">
        <input
          class="sc-combobox-input"
          id={inputId}
          type="text"
          role="combobox"
          autocomplete="off"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={open && activeIndex >= 0 ? optId(activeIndex) : undefined}
          aria-invalid={effectiveInvalid ? 'true' : undefined}
          aria-required={required ? 'true' : undefined}
          aria-describedby={describedby}
          value={inputValue}
          {placeholder}
          {disabled}
          {readonly}
          {oninput}
          {onkeydown}
          onpointerup={() => {
            if (!open) openList();
          }}
          onblur={() => closeList({ commit: true })}
        />
        <span class="sc-combobox-chevron" aria-hidden="true"><Icon name="chevron.down" /></span>
      </div>
    {/snippet}
    {#snippet content()}
      <ul class="sc-combobox-listbox" id={listboxId} role="listbox">
        {#each options as opt, i (opt.value)}
          <li
            class="sc-combobox-option"
            id={optId(i)}
            role="option"
            aria-selected={opt.value === value}
            aria-disabled={opt.disabled || undefined}
            data-active={i === activeIndex}
            data-disabled={opt.disabled || undefined}
            onpointerdown={(e) => {
              e.preventDefault(); // 欄の blur を防ぎ、焦点を保つ
              if (!opt.disabled) selectAt(i);
            }}
            onpointerenter={() => {
              if (!opt.disabled) activeIndex = i;
            }}
          >
            {#if opt.icon}<span class="sc-combobox-option-icon" aria-hidden="true"><Icon name={opt.icon} /></span>{/if}
            <span class="sc-combobox-option-body">
              <span class="sc-combobox-option-label">{opt.label}</span>
              {#if opt.description}<span class="sc-combobox-option-desc">{opt.description}</span>{/if}
            </span>
            {#if opt.value === value}<span class="sc-combobox-option-check" aria-hidden="true"><Icon name="check" /></span>{/if}
          </li>
        {/each}
        {#if options.length === 0}
          <!-- 空の一覧をそのまま出さない(patterns/empty-results.md の線) -->
          <li class="sc-combobox-empty" role="presentation">{emptyLabel}</li>
        {/if}
      </ul>
    {/snippet}
  </Popover>
  <!-- 件数は常設の領域が告げる(0 件も件数である)。領域は最初から居て、中身だけ差し替わる -->
  <span class="sc-combobox-count" role="status">{open ? count : ''}</span>
  {#if description}<p class="sc-combobox-description" id={descriptionId}>{@render description()}</p>{/if}
  {#if effectiveInvalid && error}<p class="sc-combobox-error" id={errorId}>{@render error()}</p>{/if}
</div>
