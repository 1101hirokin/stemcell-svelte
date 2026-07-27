<script lang="ts">
  import './Toaster.css';
  import { onDestroy, untrack } from 'svelte';
  import { META, WEB } from './meta';
  import Toast from '../Toast/Toast.svelte';
  import {
    toasts,
    setConfig,
    pause,
    resume,
    dismiss,
    finishDismiss,
    registerToaster,
    unregisterToaster,
    isActiveToaster,
  } from '../internal/toast-store.svelte';

  // 通知(Toast)のホスト。キューを隅の領域に積んで描く(RFC 0013)。状態はストアが持ち、この成分は
  // その active な描画面。StemcellProvider が既定を1つ body へ立て、app が置いた Toaster が優先する。
  interface Props {
    /** 領域を寄せる隅(論理方向。既定 block-end inline-end)。 */
    position?: (typeof META.props.position.values)[number];
    /** 同時に見せる最大数(既定 3)。 */
    max?: number;
    /** duration 省略時の既定の自律退去時間 ms(既定 5000)。 */
    defaultDuration?: number;
    /** 領域のラベル(Web 層の i18n。既定 Notifications)。 */
    regionLabel?: string;
    /** @internal provider が立てる既定ホスト。app が置いた Toaster が優先する。 */
    isDefault?: boolean;
  }
  let {
    position = META.props.position.default,
    max = META.props.max.default,
    defaultDuration = META.props.defaultDuration.default,
    regionLabel = WEB.regionLabel.default,
    isDefault = false,
  }: Props = $props();

  const uid = $props.id();
  // isDefault は mount 時に一度だけ登録に使う(app が置いた Toaster を既定より優先する調整)。
  // 値は変わらない前提なので初期値を一度読む(untrack で意図を明示)。
  untrack(() => registerToaster(uid, isDefault));
  onDestroy(() => unregisterToaster(uid));

  // 二重描画を避ける(既定+差し替え可): active なホストだけが描く。
  const active = $derived(isActiveToaster(uid));

  // active なホストだけが共有 config を設定する(既定ホストが app 指定の max/defaultDuration を後勝ちで
  // 上書きしないため。登録調整の「active だけが effective」の意図に揃える)。
  $effect(() => {
    if (active) setConfig({ max, defaultDuration });
  });

  // "block-end inline-end" → data-block / data-inline(CSS が隅へ寄せる)。split は一度だけ。
  const pos = $derived(position.split(' '));

  // 領域(landmark)。閉じたときフォーカスをここで受け止め、body へ落とさない(第1条・overlay.md §4)。
  let regionEl: HTMLDivElement | undefined = $state();

  // hover と focus は独立の一時停止経路。両方が終わって初めて再開する(overlay.md §4 の tooltip と同型・
  // SC 2.2.1)。片方だけの終了ではタイマーを再始動しない。
  let hovering = false;
  let focused = false;
  function onPointerEnter() {
    hovering = true;
    pause();
  }
  function onPointerLeave() {
    hovering = false;
    if (!focused) resume();
  }
  function onFocusIn() {
    focused = true;
    pause();
  }
  function onFocusOut(e: FocusEvent) {
    if (regionEl?.contains(e.relatedTarget as Node)) return; // 領域内の移動は「終了」ではない
    focused = false;
    if (!hovering) resume();
  }

  // 閉じる/アクションで通知を退去させる。除去でフォーカスが body へ落ちないよう、領域内に focus があれば
  // 領域へ移す(overlay.md §4 の到達性の帰結。キーボードで閉じても現在地を失わない)。
  function close(id: string) {
    const hadFocus = regionEl?.contains(document.activeElement);
    dismiss(id);
    if (hadFocus) regionEl?.focus();
  }
</script>

{#if active}
  <!-- 領域は landmark(role=region + aria-label)でキーボード到達可能(F6 相当)。奪わない代わりの到達性
       (overlay.md §4)。告知は個々の Toast の role=status/alert が担い、領域自体は告知しない。
       タイマーは hover / focus 中は一時停止する(SC 2.2.1)。 -->
  <div
    class="sc-toaster"
    bind:this={regionEl}
    data-block={pos[0]}
    data-inline={pos[1]}
    role="region"
    aria-label={regionLabel}
    tabindex="-1"
    onpointerenter={onPointerEnter}
    onpointerleave={onPointerLeave}
    onfocusin={onFocusIn}
    onfocusout={onFocusOut}
  >
    {#each toasts as t (t.id)}
      <div class="sc-toaster-item">
        <Toast
          message={t.message}
          color={t.color}
          dismissible={t.dismissible}
          actionLabel={t.actionLabel}
          leaving={t.leaving}
          onexitend={() => finishDismiss(t.id)}
          onaction={t.onAction}
          ondismiss={() => close(t.id)}
        />
      </div>
    {/each}
  </div>
{/if}
