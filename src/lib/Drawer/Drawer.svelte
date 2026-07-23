<script lang="ts">
  import './Drawer.css';
  import { onDestroy } from 'svelte';
  import { META } from './meta';
  import { pushModal, removeModal } from '../internal/modal-stack';
  import type { Snippet } from 'svelte';

  // 画面の端に寄って開く modal(overlay の modal 類。Drawer.md)。Dialog と同じ native `<dialog>` + showModal() を
  // 土台にする(focus trap・top-layer・::backdrop・Escape・背後 inert が無償。憲法 第2条 / 第7条)。違うのは位置
  // (side の端に貼る)と入りの方向(その端からスライド)だけ。振る舞いは Dialog と同じ(Dialog.md を出典に引く)。
  interface Props {
    /** 開いているか。アプリが所有する値。true で showModal、false で close。 */
    open?: boolean;
    /** 貼り付く端(論理方向。RTL / 縦書きで自動反転)。既定は inline-end(行末側)。 */
    side?: (typeof META.props.side.values)[number];
    /** 退出の仕方(overlay.md §8 の裁定。既定 light。Dialog と同じ)。 */
    dismiss?: (typeof META.props.dismiss.values)[number];
    /** 開閉の要求(light dismiss は false を発火。アプリが open を更新する)。 */
    onopenchange?: (open: boolean) => void;
    /** 見出し。modal のアクセシブルネーム(aria-labelledby)。無名の modal を許さない。 */
    title: Snippet;
    /** 本体。 */
    content: Snippet;
    /** 脚の操作(ボタン群)。省略可。explicit の Drawer はここに閉じる手段を必ず置く。 */
    actions?: Snippet;
  }
  let {
    open = $bindable(META.props.open.default),
    side = META.props.side.default,
    dismiss = META.props.dismiss.default,
    onopenchange,
    title,
    content,
    actions,
  }: Props = $props();

  const uid = $props.id();
  const titleId = `${uid}-title`;
  let dialogEl = $state<HTMLDialogElement>();

  // open を native <dialog> の modal 表示へ橋渡し。showModal 非対応(jsdom 等)では API 呼び出しを飛ばす。
  $effect(() => {
    const el = dialogEl;
    if (!el || typeof el.showModal !== 'function') return;
    if (open && !el.open) {
      el.showModal();
      pushModal(el);
    } else if (!open && el.open) {
      el.close();
    }
  });

  // explicit なのに閉じる手段(actions)が無いと閉じ込められる(Drawer.md / Dialog.md §3)。実バグなので警告する。
  $effect(() => {
    if (dismiss === 'explicit' && !actions) {
      console.warn(
        '[stemcell] Drawer: dismiss="explicit" は Escape / 背後クリックで閉じません。actions に閉じる手段を必ず置いてください。',
      );
    }
  });

  onDestroy(() => removeModal(dialogEl));

  // native の cancel(Escape)。explicit では閉じない。light は既定に任せ、native が閉じて close が飛ぶ。
  function onCancel(e: Event) {
    if (dismiss === 'explicit') e.preventDefault();
  }
  // native が閉じたら重なりから外し、所有者へ橋渡し。自分で close したときは open が既に false なので二重発火しない。
  function onClose() {
    removeModal(dialogEl);
    if (open) onopenchange?.(false);
  }
  // 背後(scrim)クリックで閉じる(light のみ)。押下と解放の両方が背後だったときだけ(ドラッグ選択の誤爆を防ぐ)。
  let pressedOnBackdrop = false;
  function onDialogPointerdown(e: PointerEvent) {
    pressedOnBackdrop = e.target === dialogEl;
  }
  function onDialogClick(e: MouseEvent) {
    const onBackdrop = e.target === dialogEl && pressedOnBackdrop;
    pressedOnBackdrop = false;
    if (dismiss === 'light' && onBackdrop) onopenchange?.(false);
  }
</script>

<dialog
  bind:this={dialogEl}
  class="sc-drawer"
  data-side={side}
  aria-labelledby={titleId}
  oncancel={onCancel}
  onclose={onClose}
  onpointerdown={onDialogPointerdown}
  onclick={onDialogClick}
>
  <div class="sc-drawer-panel">
    <h2 class="sc-drawer-title" id={titleId}>{@render title()}</h2>
    <div class="sc-drawer-content">{@render content()}</div>
    {#if actions}<div class="sc-drawer-actions">{@render actions()}</div>{/if}
  </div>
</dialog>
