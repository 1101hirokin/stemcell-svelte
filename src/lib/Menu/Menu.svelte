<script lang="ts">
  import './Menu.css';
  import { tick } from 'svelte';
  import { META } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import Popover from '../Popover/Popover.svelte';
  import type { Snippet } from 'svelte';

  // アクションの集合を畳んで出すメニュー(APG の menu button + menu。Menu.md)。トリガーは Menu が所有し
  // ARIA を配線する(RFC 0008)。中への移動は実 DOM フォーカスの roving(overlay.md §4 の二形態のうち Menu 側。
  // Select の listbox が仮想フォーカスなのと対)。面/影/角/層/出入りは合成する Popover が所有する。
  interface Item {
    id: string;
    label: string;
    icon?: string;
    description?: string;
    disabled?: boolean;
  }
  interface Props {
    /** メニュー項目の列(データ。Select の options と同じ理由)。 */
    items: Item[];
    /** トリガー全体を無効化する。開けない。 */
    disabled?: boolean;
    /** 寸法(トリガーの inset と項目の密度)。 */
    size?: (typeof META.props.size.values)[number];
    /** 優先の開き方向。Popover へ委譲する。 */
    placement?: (typeof META.props.placement.values)[number];
    /** menuitem が活性化されたとき id を渡す(行為の起動。値の変化ではない)。 */
    onselect?: (id: string) => void;
    /** トリガー button の中身(ラベル・アイコン)。Menu が button と ARIA を所有する。 */
    trigger: Snippet;
  }
  let {
    items,
    disabled = META.props.disabled.default,
    size = META.props.size.default,
    placement = META.props.placement.default,
    onselect,
    trigger,
  }: Props = $props();

  const uid = $props.id();
  const triggerId = `${uid}-trigger`;
  const menuId = `${uid}-menu`;
  const itemId = (i: number) => `${uid}-item-${i}`;

  let open = $state(false);
  // roving の指す先(実 DOM フォーカスの対象。activedescendant ではない)。閉じている間は -1。
  let activeIndex = $state(-1);
  let triggerEl = $state<HTMLButtonElement>();
  let menuListEl = $state<HTMLUListElement>();
  // 各 menuitem 要素の実フォーカス用の参照。$state で持ち、配列の伸縮を Svelte の管理下に置く
  // (bind:this を非 reactive な素の配列へ張ると binding_property_non_reactive 警告になる)。
  let itemEls = $state<HTMLLIElement[]>([]);

  const enabledIndexes = $derived(
    items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0),
  );

  async function focusItem(i: number) {
    activeIndex = i;
    await tick(); // tabindex=0 が付いてから実フォーカスする
    itemEls[i]?.focus();
  }
  async function openMenu(edge: 'first' | 'last') {
    if (disabled || items.length === 0) return; // 項目が無いメニューは開かない
    open = true;
    const target = edge === 'last' ? enabledIndexes.at(-1) : enabledIndexes[0];
    if (target !== undefined) {
      await focusItem(target);
    } else {
      // 全項目 disabled: 動かせる項目が無いので menu 容部品へ実フォーカスを入れる(トリガーに残さない)。
      // これで focus は popover 内に入り、Escape(容部品の keydown)で閉じられる。フォーカスがトリガーに
      // 残ると Popover の focusout が誤発火しない代わりに矢印も効かず操作不能に見えるのを避ける。
      await tick();
      menuListEl?.focus();
    }
  }
  // 閉じるときはトリガーへフォーカスを返す(Escape / 活性化 / 外側。native popover も同じ先へ戻すので二重でも同一)。
  function closeMenu() {
    open = false;
    activeIndex = -1;
    triggerEl?.focus();
  }
  function moveFocus(dir: 1 | -1) {
    if (!enabledIndexes.length) return;
    const pos = enabledIndexes.indexOf(activeIndex);
    const next =
      pos < 0
        ? dir > 0
          ? 0
          : enabledIndexes.length - 1
        : Math.min(Math.max(pos + dir, 0), enabledIndexes.length - 1);
    focusItem(enabledIndexes[next]!);
  }
  function activateAt(i: number) {
    const it = items[i];
    if (!it || it.disabled) return;
    onselect?.(it.id);
    closeMenu();
  }

  // type-ahead(先頭一致。web-keys arrows.menu)。menu では Space も活性化なので type-ahead は文字のみ。
  let typeBuffer = '';
  let typeTimer: ReturnType<typeof setTimeout> | undefined;
  function typeahead(ch: string) {
    typeBuffer += ch.toLowerCase();
    clearTimeout(typeTimer);
    typeTimer = setTimeout(() => (typeBuffer = ''), 500);
    const hit = enabledIndexes.find((i) => items[i]!.label.toLowerCase().startsWith(typeBuffer));
    if (hit !== undefined) focusItem(hit);
  }

  function onTriggerKeydown(e: KeyboardEvent) {
    if (open) return; // 開いている間フォーカスは項目(または全 disabled 時は menu 本体)にあり、ここへは来ない
    if (['ArrowDown', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openMenu('first');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      openMenu('last');
    }
  }
  function onMenuKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveFocus(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveFocus(-1);
        break;
      case 'Home':
        e.preventDefault();
        if (enabledIndexes[0] !== undefined) focusItem(enabledIndexes[0]);
        break;
      case 'End':
        e.preventDefault();
        if (enabledIndexes.at(-1) !== undefined) focusItem(enabledIndexes.at(-1)!);
        break;
      case 'Enter':
      case ' ':
        // menu では Enter も Space も活性化(APG menu。listbox と分かれる。web-keys arrows.menu)
        e.preventDefault();
        if (activeIndex >= 0) activateAt(activeIndex);
        break;
      case 'Escape':
        e.preventDefault();
        closeMenu();
        break;
      case 'Tab':
        // Tab はメニューを閉じてフォーカスを進める(APG)。トリガーへ戻さず自然な移動に任せる
        open = false;
        activeIndex = -1;
        break;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) typeahead(e.key);
        break;
    }
  }
  // native の light dismiss(Escape / 外側)で閉じたら同期する。トリガーへの復帰は native popover が担う
  // (previouslyFocused = トリガー)。self-close(open=false)では二重発火しない(Popover の onToggle が guard)。
  function onOpenChange(o: boolean) {
    if (!o) {
      open = false;
      activeIndex = -1;
    }
  }
</script>

<Popover {open} {placement} onopenchange={onOpenChange}>
  {#snippet anchor()}
    <button
      bind:this={triggerEl}
      class="sc-menu-trigger"
      data-size={size}
      id={triggerId}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={menuId}
      {disabled}
      onclick={() => (open ? closeMenu() : openMenu('first'))}
      onkeydown={onTriggerKeydown}
    >
      {@render trigger()}
    </button>
  {/snippet}
  {#snippet content()}
    <ul
      bind:this={menuListEl}
      class="sc-menu-list"
      id={menuId}
      role="menu"
      aria-labelledby={triggerId}
      tabindex="-1"
      onkeydown={onMenuKeydown}
    >
      {#each items as it, i (it.id)}
        <!-- キーボードは menu(ul)側の onMenuKeydown が roving で一括処理する(APG menu パターン。項目個別の
             keydown は持たない)。onclick はマウス活性化。ゆえに項目単位のキーハンドラ欠如は設計どおり -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <li
          bind:this={itemEls[i]}
          class="sc-menu-item"
          id={itemId(i)}
          role="menuitem"
          tabindex={i === activeIndex ? 0 : -1}
          aria-disabled={it.disabled || undefined}
          data-active={i === activeIndex}
          data-disabled={it.disabled || undefined}
          onclick={() => activateAt(i)}
          onpointerenter={() => {
            if (!it.disabled) focusItem(i);
          }}
        >
          {#if it.icon}<span class="sc-menu-item-icon" aria-hidden="true"><Icon name={it.icon} /></span>{/if}
          <span class="sc-menu-item-body">
            <span class="sc-menu-item-label">{it.label}</span>
            {#if it.description}<span class="sc-menu-item-desc">{it.description}</span>{/if}
          </span>
        </li>
      {/each}
    </ul>
  {/snippet}
</Popover>
