<script lang="ts">
  import './Dialog.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  // ビューポート中央に開く modal(overlay の modal 類。Dialog.md)。Web は native `<dialog>` + showModal() を
  // 土台にする: focus trap・top-layer・::backdrop(scrim)・Escape・背後 inert が標準で無償(憲法 第2条「native の
  // 機構で満たす」/ 第7条。自前の focus trap を持たない)。開閉はアプリが所有する(open は値。overlay.md §6)。
  interface Props {
    /** 開いているか。アプリが所有する値。true で showModal、false で close。 */
    open?: boolean;
    /** 退出の仕方(overlay.md §8 の裁定。既定 light)。 */
    dismiss?: (typeof META.props.dismiss.values)[number];
    /** 開閉の要求(light dismiss は false を発火。アプリが open を更新する)。 */
    onopenchange?: (open: boolean) => void;
    /** 見出し。modal のアクセシブルネーム(aria-labelledby)。無名の modal を許さない。 */
    title: Snippet;
    /** 本体。 */
    content: Snippet;
    /** 脚の操作(ボタン群)。省略可。explicit の Dialog はここに閉じる手段を置く。 */
    actions?: Snippet;
  }
  let {
    open = $bindable(META.props.open.default),
    dismiss = META.props.dismiss.default,
    onopenchange,
    title,
    content,
    actions,
  }: Props = $props();

  const uid = $props.id();
  const titleId = `${uid}-title`;
  let dialogEl = $state<HTMLDialogElement>();

  // open を native <dialog> の modal 表示へ橋渡し(top-layer へ出す/戻す)。showModal 非対応(jsdom 等)では
  // API 呼び出しを飛ばす。中身は常に DOM にあるので、閉じ経路のロジックのテストは成立する。
  $effect(() => {
    const el = dialogEl;
    if (!el || typeof el.showModal !== 'function') return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  });

  // native の cancel(Escape)。explicit では閉じない(cancel を握りつぶす)。light は既定に任せ、native が
  // 閉じて close が飛ぶ。
  function onCancel(e: Event) {
    if (dismiss === 'explicit') e.preventDefault();
  }
  // native が閉じたら所有者へ橋渡し。自分で close したときは open が既に false なので二重発火しない。
  function onClose() {
    if (open) onopenchange?.(false);
  }
  // 背後(scrim)クリックで閉じる(light のみ)。::backdrop クリックの event.target は <dialog> 自身になる
  // (パネルは子要素なので区別できる)。dialog に padding を持たせず、パネルが器を満たすので、この判定で足りる。
  function onDialogClick(e: MouseEvent) {
    if (dismiss !== 'light') return;
    if (e.target === dialogEl) onopenchange?.(false);
  }
</script>

<dialog
  bind:this={dialogEl}
  class="sc-dialog"
  aria-labelledby={titleId}
  oncancel={onCancel}
  onclose={onClose}
  onclick={onDialogClick}
>
  <div class="sc-dialog-panel">
    <h2 class="sc-dialog-title" id={titleId}>{@render title()}</h2>
    <div class="sc-dialog-content">{@render content()}</div>
    {#if actions}<div class="sc-dialog-actions">{@render actions()}</div>{/if}
  </div>
</dialog>
