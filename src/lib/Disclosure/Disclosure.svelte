<script lang="ts">
  import './Disclosure.css';
  import { META } from './meta';
  import type { Snippet } from 'svelte';

  // 開いたり閉じたりできる開示(Disclosure.md)。常に見える要約の下に内容を持ち、open で現す。
  // 複数をまとめて排他に開く形(Accordion)は本部品の外(Collection クラスタ7の語彙)。
  interface Props {
    /** 開いているか。アプリが所有する値(state.md §6)。UI が内部で勝手にトグルを確定しない。 */
    open?: boolean;
    /** 常に見えるトリガー兼見出し(必須)。開示のアクセシブルネームになる。 */
    summary: Snippet;
    /** open のとき現れる内容(必須)。 */
    content: Snippet;
    /** 開閉の要求。アプリが open を更新する(Dialog の open と同じ向き)。 */
    onopenchange?: (open: boolean) => void;
  }
  let {
    open = $bindable(META.props.open.default),
    summary,
    content,
    onopenchange,
  }: Props = $props();

  const uid = $props.id();
  const contentId = `${uid}-content`;

  // native は summary のクリックで open を自分で切り替える。値の所有はアプリなので、
  // 既定動作を止めて要求だけを伝える(Dialog の light dismiss と同じ結線)。
  const handleToggle = (e: Event) => {
    e.preventDefault();
    const next = !open;
    open = next;
    onopenchange?.(next);
  };
</script>

<!-- native <details> / <summary> を土台にする(第7条 progressive enhancement。Dialog が <dialog> を
     土台にするのと同型)。開閉・トリガーの button 意味論・aria-expanded・畳んだ内容の非到達を native が
     無償で満たす。aria-controls だけは native が張らないので補う。
     summary と content は同じ階層の兄弟に置く: content を button の中へ入れると対話要素の入れ子
     (ARIA のアンチパターン)になる(契約 a11y)。 -->
<details class="sc-disclosure" {open}>
  <summary class="sc-disclosure-summary" aria-controls={contentId} onclick={handleToggle}>
    <span class="sc-disclosure-marker" aria-hidden="true"></span>
    <span class="sc-disclosure-summary-text">{@render summary()}</span>
  </summary>
  <div class="sc-disclosure-content" id={contentId}>{@render content()}</div>
</details>
