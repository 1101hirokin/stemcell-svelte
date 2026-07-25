<script lang="ts">
  import './CircularLoader.css';
  import { META } from './meta';

  // 円形・不確定。いつ終わるか分からない待ちを告げる(CircularLoader.md)。
  // 終わりの割合が分かるなら CircularProgress(別部品)。
  interface Props {
    /** 何を待っているか(必須)。回る輪は視覚でしか語らないので、意味は名前が運ぶ。 */
    label: string;
    /** loader チャンネルの径(16 / 24 / 32px。size.md §2)。 */
    size?: (typeof META.props.size.values)[number];
  }
  let { label, size = META.props.size.default }: Props = $props();
</script>

<!-- role=status を採る(契約 a11y の「role=status / aria-busy 相当」)。暗黙で aria-live=polite と
     aria-atomic=true を持ち、待ちが始まったことを告げる。progressbar から aria-valuenow を落とす形も
     標準だが、live region でないため出現を告げない。要求は「待ちの状態が支援技術に届く」なので status。
     図形は装飾として隠し、意味は視覚に隠した文字が運ぶ(Badge の dot と同じ clip 技法)。 -->
<div class="sc-circularloader" data-size={size} role="status">
  <span class="sc-circularloader-sr">{label}</span>
  <svg class="sc-circularloader-figure" viewBox="0 0 40 40" aria-hidden="true">
    <!-- 弧。全周の一部だけを描き、回転で待ちを示す。端は丸(stroke-linecap) -->
    <circle class="sc-circularloader-arc" cx="20" cy="20" r="16" fill="none" />
  </svg>
</div>
