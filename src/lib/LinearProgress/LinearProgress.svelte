<script lang="ts">
  import './LinearProgress.css';
  import { META } from './meta';
  import { resolveProgress } from '../internal/progress';

  // 線形・確定。終わりの割合が分かる進みを領域の幅で見せる(LinearProgress.md)。
  // 分からない待ちは LinearLoader(別部品)。
  interface Props {
    /** 何の進捗か(必須)。progressbar は ARIA 上アクセシブルネームを要する。 */
    label: string;
    /** 現在値(必須)。0 ≤ value ≤ max を期待し、範囲外は clamp する(契約)。 */
    value: number;
    /** 上限。正の数を期待し、不正なら warn して既定へ退避する。 */
    max?: number;
    /** 可視の数値表示。既定は出さない(第3条の抑制)。支援技術への伝達はこの prop と無関係に常に行う。 */
    showValue?: boolean;
  }
  let {
    label,
    value,
    max = META.props.max.default,
    showValue = META.props.showValue.default,
  }: Props = $props();

  const resolved = $derived(resolveProgress('LinearProgress', value, max));
</script>

<!-- native <progress> を土台にしない(AGENTS.md の判断記録)。native が無償で与えるのは role と値の
     写像だけで ARIA 属性3つで置き換わる一方、トークン駆動の見た目を跨ブラウザで作れず、
     CircularProgress は native では描けない。4本で機構を揃える。
     値は showValue と無関係に常に支援技術へ届く(契約 a11y。第1条)。 -->
<div
  class="sc-linearprogress"
  role="progressbar"
  aria-label={label}
  aria-valuenow={resolved.value}
  aria-valuemin={0}
  aria-valuemax={resolved.max}
>
  <div class="sc-linearprogress-track">
    <!-- 帯は inline-start から伸びる(論理方向。RTL で自動的に反転する。layout.md §7) -->
    <div class="sc-linearprogress-indicator" style="inline-size: {resolved.percent}%"></div>
  </div>
  {#if showValue}
    <!-- 視覚の正準は「{n}%」で全実装同一。ロケール写像は表現(契約) -->
    <span class="sc-linearprogress-value" aria-hidden="true">{Math.round(resolved.percent)}%</span>
  {/if}
</div>
