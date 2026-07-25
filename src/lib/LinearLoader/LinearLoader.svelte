<script lang="ts">
  import './LinearLoader.css';

  // 線形・不確定。いつ終わるか分からない待ちを領域の幅で告げる(LinearLoader.md)。
  // 終わりの割合が分かるなら LinearProgress(別部品)。径を持たず、幅は器いっぱい。
  interface Props {
    /** 何を待っているか(必須)。流れる帯は視覚でしか語らないので、意味は名前が運ぶ。 */
    label: string;
  }
  let { label }: Props = $props();
</script>

<!-- role=status を採る理由は CircularLoader と同じ(契約 a11y の「role=status / aria-busy 相当」)。
     図形は装飾として隠し、意味は視覚に隠した文字が運ぶ。 -->
<div class="sc-linearloader" role="status">
  <span class="sc-linearloader-sr">{label}</span>
  <span class="sc-linearloader-indicator" aria-hidden="true"></span>
</div>
