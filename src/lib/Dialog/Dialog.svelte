<script module lang="ts">
  // 開いている modal の重なり(単一 scrim。RFC 0009 / overlay.md §8)。native の ::backdrop は枚数ぶん積算する
  // ので、最上位以外に data-under を付けて ::backdrop を透過にし、見える scrim を一段に保つ。
  const modalStack: HTMLDialogElement[] = [];
  function restackModals() {
    modalStack.forEach((el, i) => el.toggleAttribute('data-under', i < modalStack.length - 1));
  }
</script>

<script lang="ts">
  import './Dialog.css';
  import { onDestroy } from 'svelte';
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
    /** 脚の操作(ボタン群)。省略可。explicit の Dialog はここに閉じる手段を必ず置く。 */
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
    if (open && !el.open) {
      el.showModal();
      if (!modalStack.includes(el)) modalStack.push(el);
      restackModals();
    } else if (!open && el.open) {
      el.close();
    }
  });

  // explicit なのに閉じる手段(actions)が無いと、Escape も背後も効かず閉じ込められる(Dialog.md §3)。
  // title を required で型強制したのと対に、actions は light では省略可なので型では縛れない。実バグなので警告する。
  $effect(() => {
    if (dismiss === 'explicit' && !actions) {
      console.warn(
        '[stemcell] Dialog: dismiss="explicit" は Escape / 背後クリックで閉じません。actions に閉じる手段を必ず置いてください。',
      );
    }
  });

  function unstack(el: HTMLDialogElement | undefined) {
    if (!el) return;
    const i = modalStack.indexOf(el);
    if (i >= 0) modalStack.splice(i, 1);
    el.removeAttribute('data-under');
    restackModals();
  }
  onDestroy(() => unstack(dialogEl));

  // native の cancel(Escape)。explicit では閉じない(cancel を握りつぶす)。light は既定に任せ、native が
  // 閉じて close が飛ぶ。
  function onCancel(e: Event) {
    if (dismiss === 'explicit') e.preventDefault();
  }
  // native が閉じたら重なりから外し、所有者へ橋渡し。自分で close したときは open が既に false なので二重発火しない。
  function onClose() {
    unstack(dialogEl);
    if (open) onopenchange?.(false);
  }
  // 背後(scrim)クリックで閉じる(light のみ)。::backdrop の event.target は <dialog> 自身になる(パネルは子)。
  // 押下と解放の両方が背後だったときだけ閉じる(パネル内の文字をドラッグ選択して外で離す誤爆を防ぐ)。
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
  class="sc-dialog"
  aria-labelledby={titleId}
  oncancel={onCancel}
  onclose={onClose}
  onpointerdown={onDialogPointerdown}
  onclick={onDialogClick}
>
  <div class="sc-dialog-panel">
    <h2 class="sc-dialog-title" id={titleId}>{@render title()}</h2>
    <div class="sc-dialog-content">{@render content()}</div>
    {#if actions}<div class="sc-dialog-actions">{@render actions()}</div>{/if}
  </div>
</dialog>
