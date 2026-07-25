<script lang="ts">
  import './CircularProgress.css';
  import { META } from './meta';
  import { resolveProgress } from '../internal/progress';

  // 円形・確定。終わりの割合が分かる進みを見せる(CircularProgress.md)。
  // 分からない待ちは CircularLoader(別部品)。値の扱いは LinearProgress と同一の規則。
  interface Props {
    /** 何の進捗か(必須)。progressbar は ARIA 上アクセシブルネームを要する。 */
    label: string;
    /** 現在値(必須)。0 ≤ value ≤ max を期待し、範囲外は clamp する(契約)。 */
    value: number;
    /** 上限。正の数を期待し、不正なら warn して既定へ退避する。 */
    max?: number;
    /** 可視の数値表示。既定は出さない(第3条の抑制)。支援技術への伝達はこの prop と無関係に常に行う。 */
    showValue?: boolean;
    /** loader チャンネルの径(16 / 24 / 32px。size.md §2。CircularLoader と同じ体系)。 */
    size?: (typeof META.props.size.values)[number];
  }
  let {
    label,
    value,
    max = META.props.max.default,
    showValue = META.props.showValue.default,
    size = META.props.size.default,
  }: Props = $props();

  const resolved = $derived(resolveProgress('CircularProgress', value, max));

  // 弧の長さは stroke-dasharray で表す。半径は viewBox の座標系で持ち、実寸は CSS(loader.{size})が決める。
  // 太さは track-thickness を径に対する比で写す必要があるため、CSS 側で stroke-width を引く。
  const R = 16;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const dash = $derived((resolved.percent / 100) * CIRCUMFERENCE);
</script>

<!-- native <progress> では円を描けない(AGENTS.md の判断記録)。値は showValue と無関係に
     常に支援技術へ届く(契約 a11y。第1条)。図形は装飾として隠す。 -->
<div
  class="sc-circularprogress"
  data-size={size}
  role="progressbar"
  aria-label={label}
  aria-valuenow={resolved.value}
  aria-valuemin={0}
  aria-valuemax={resolved.max}
>
  <svg class="sc-circularprogress-figure" viewBox="0 0 40 40" aria-hidden="true">
    <!-- 軌道。全周 -->
    <circle class="sc-circularprogress-track" cx="20" cy="20" r={R} fill="none" />
    <!-- 弧。12時から時計回りに伸びる(回転は CSS)。端は丸(pill) -->
    <circle
      class="sc-circularprogress-indicator"
      cx="20"
      cy="20"
      r={R}
      fill="none"
      stroke-dasharray="{dash} {CIRCUMFERENCE}"
    />
  </svg>
  {#if showValue}
    <!-- 視覚の正準は「{n}%」で全実装同一。置き方(中央)は Expressive -->
    <span class="sc-circularprogress-value" aria-hidden="true">{Math.round(resolved.percent)}%</span>
  {/if}
</div>
