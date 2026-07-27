<script lang="ts">
  import './Select.css';
  import { META } from './meta';
  import { enabledIndexes, initialActive, nextActive } from '../internal/listbox';
  import Icon from '../Icon/Icon.svelte';
  import Popover from '../Popover/Popover.svelte';
  import type { Snippet } from 'svelte';

  // 閉じた選択肢からひとつ選ぶ入力。Web は二経路(RFC 0007 の B2): touch=native select、
  // pointer=カスタム combobox+listbox(Popover を合成)。構造・トークンは TextField と同型(field.md §6)。
  interface Option {
    value: string;
    label: string;
    icon?: string;
    description?: string;
    disabled?: boolean;
  }
  interface Props {
    /** フォーム名(native の <form> 送信・FormData・reset に参加。field.md §5)。 */
    name?: string;
    value?: string;
    options: Option[];
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    /** 名前を視覚から隠す(支援技術には届く。field.md §2。器が文脈を語っている場合の例外)。 */
    labelHidden?: boolean;
    size?: (typeof META.props.size.values)[number];
    onchange?: (value: string) => void;
    label: Snippet;
    description?: Snippet;
    error?: Snippet;
  }
  let {
    name,
    value = $bindable(META.props.value.default),
    options,
    placeholder,
    disabled = META.props.disabled.default,
    invalid = META.props.invalid.default,
    required = META.props.required.default,
    labelHidden = META.props.labelHidden.default,
    size = META.props.size.default,
    onchange,
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

  const describedby = $derived(
    [description ? descriptionId : null, invalid && error ? errorId : null].filter(Boolean).join(' ') ||
      undefined,
  );

  // pointer 検出(B2)。coarse(touch 主)は native、fine(pointer)は custom(Select.md §2)
  let coarse = $state(false);
  $effect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => (coarse = mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  });

  // ---- custom(pointer)経路の状態 ----
  let open = $state(false);
  let activeIndex = $state(-1); // aria-activedescendant の指す先(DOM focus はトリガー据置)
  const selectedIndex = $derived(options.findIndex((o) => o.value === value));
  const selectedOption = $derived(options.find((o) => o.value === value));
  // 辿る計算は internal/listbox が持つ(Combobox と同じ手触り)
  const enabled = $derived(enabledIndexes(options));

  function selectAt(i: number) {
    const o = options[i];
    if (!o || o.disabled) return;
    value = o.value;
    onchange?.(o.value);
  }
  function openList() {
    if (disabled) return;
    open = true;
    activeIndex = initialActive(options, selectedIndex);
  }
  function closeList() {
    open = false;
    activeIndex = -1;
  }
  function moveActive(dir: 1 | -1) {
    activeIndex = nextActive(enabled, activeIndex, dir);
  }

  // type-ahead(先頭一致。空白を含む多語 label も辿れる。web-keys arrows.listbox)
  let typeBuffer = '';
  let typeTimer: ReturnType<typeof setTimeout> | undefined;
  function typeahead(ch: string) {
    typeBuffer += ch.toLowerCase();
    clearTimeout(typeTimer);
    typeTimer = setTimeout(() => (typeBuffer = ''), 500);
    const hit = enabled.find((i) => options[i]!.label.toLowerCase().startsWith(typeBuffer));
    if (hit !== undefined) activeIndex = hit;
  }

  function onTriggerKeydown(e: KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveActive(-1);
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
        e.preventDefault();
        if (activeIndex >= 0) selectAt(activeIndex);
        closeList();
        break;
      case 'Escape':
        e.preventDefault();
        closeList();
        break;
      case 'Tab':
        // commit して閉じ、フォーカスは進める(preventDefault しない)
        if (activeIndex >= 0) selectAt(activeIndex);
        closeList();
        break;
      case ' ':
        // 開いている間の Space は type-ahead の文字(選択キーではない。web-keys arrows.listbox)
        e.preventDefault();
        typeahead(' ');
        break;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) typeahead(e.key);
        break;
    }
  }
</script>

<div class="sc-select" data-size={size} data-invalid={invalid} data-disabled={disabled} data-label-hidden={labelHidden}>
  <label class="sc-select-label" for={inputId}>
    {@render label()}{#if required}<span class="sc-select-required" aria-hidden="true">*</span
      >{/if}
  </label>

  {#if coarse}
    <!-- touch: native <select>。開閉・キー・SR・高コントラストは UA 所有。リッチは name へ劣化(Select.md §2) -->
    <div class="sc-select-control">
      <select
        class="sc-select-input"
        id={inputId}
        {name}
        bind:value
        {disabled}
        {required}
        aria-invalid={invalid ? 'true' : undefined}
        aria-describedby={describedby}
        onchange={(e) => onchange?.(e.currentTarget.value)}
      >
        {#if placeholder !== undefined}
          <option value="" disabled>{placeholder}</option>
        {/if}
        {#each options as opt (opt.value)}
          <option value={opt.value} disabled={opt.disabled}>{opt.label}</option>
        {/each}
      </select>
      <span class="sc-select-chevron" aria-hidden="true"><Icon name="chevron.down" /></span>
    </div>
  {:else}
    <!-- pointer: カスタム combobox + listbox(APG select-only。DOM focus はトリガー、option は activedescendant) -->
    <!-- combobox は button で送信対象にならないため、value をミラーする隠し input で form 参加を補う(field.md §5)。
         required の native 検証は hidden では効かない(制約検証の対象外)ので、必須は aria-required に留まる -->
    {#if name}<input type="hidden" {name} {value} />{/if}
    <Popover {open} onopenchange={(o) => (o ? openList() : closeList())}>
      {#snippet anchor()}
        <button
          class="sc-select-control sc-select-trigger"
          id={inputId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open && activeIndex >= 0 ? optId(activeIndex) : undefined}
          aria-invalid={invalid ? 'true' : undefined}
          aria-required={required ? 'true' : undefined}
          aria-describedby={describedby}
          {disabled}
          onclick={() => (open ? closeList() : openList())}
          onkeydown={onTriggerKeydown}
        >
          <span class="sc-select-value" data-placeholder={!selectedOption}>
            {#if selectedOption}
              {#if selectedOption.icon}<Icon name={selectedOption.icon} />{/if}
              {selectedOption.label}
            {:else}{placeholder ?? ''}{/if}
          </span>
          <span class="sc-select-chevron" aria-hidden="true"><Icon name="chevron.down" /></span>
        </button>
      {/snippet}
      {#snippet content()}
        <ul class="sc-select-listbox" id={listboxId} role="listbox">
          {#each options as opt, i (opt.value)}
            <li
              class="sc-select-option"
              id={optId(i)}
              role="option"
              aria-selected={opt.value === value}
              aria-disabled={opt.disabled || undefined}
              data-active={i === activeIndex}
              data-disabled={opt.disabled || undefined}
              onpointerdown={(e) => {
                e.preventDefault(); // トリガーの blur を防ぎ focus を保つ
                if (!opt.disabled) {
                  selectAt(i);
                  closeList();
                }
              }}
              onpointerenter={() => {
                if (!opt.disabled) activeIndex = i;
              }}
            >
              {#if opt.icon}<span class="sc-select-option-icon" aria-hidden="true"><Icon name={opt.icon} /></span>{/if}
              <span class="sc-select-option-body">
                <span class="sc-select-option-label">{opt.label}</span>
                {#if opt.description}<span class="sc-select-option-desc">{opt.description}</span>{/if}
              </span>
              {#if opt.value === value}<span class="sc-select-option-check" aria-hidden="true"><Icon name="check" /></span>{/if}
            </li>
          {/each}
        </ul>
      {/snippet}
    </Popover>
  {/if}

  {#if description}<p class="sc-select-description" id={descriptionId}>
      {@render description()}
    </p>{/if}
  {#if invalid && error}<p class="sc-select-error" id={errorId}>
      {@render error()}
    </p>{/if}
</div>
