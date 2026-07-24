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

  $effect(() => {
    setConfig({ max, defaultDuration });
  });

  // "block-end inline-end" → data-block / data-inline(CSS が隅へ寄せる)
  const block = $derived(position.split(' ')[0]);
  const inline = $derived(position.split(' ')[1]);
</script>

{#if active}
  <!-- 領域は landmark(role=region + aria-label)でキーボード到達可能(F6 相当)。奪わない代わりの到達性
       (overlay.md §4)。告知は個々の Toast の role=status/alert が担い、領域自体は告知しない。
       タイマーは hover / focus 中は一時停止する(SC 2.2.1)。 -->
  <div
    class="sc-toaster"
    data-block={block}
    data-inline={inline}
    role="region"
    aria-label={regionLabel}
    onpointerenter={pause}
    onpointerleave={resume}
    onfocusin={pause}
    onfocusout={resume}
  >
    {#each toasts as t (t.id)}
      <div class="sc-toaster-item">
        <Toast
          id={t.id}
          message={t.message}
          color={t.color}
          dismissible={t.dismissible}
          actionLabel={t.actionLabel}
          leaving={t.leaving}
          onaction={t.onAction}
          ondismiss={() => dismiss(t.id)}
        />
      </div>
    {/each}
  </div>
{/if}
