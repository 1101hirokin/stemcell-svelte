<script lang="ts">
  import './Skeleton.css';
  import { META } from './meta';

  // 読み込み中の内容の代役。来るものの形を先に置き、レイアウトの跳ねを防ぐ(Skeleton.md §1)。
  interface Props {
    /** 何を模すか。text=文字行(高さは周囲の font に従う)、box=面(器いっぱい)、circle=正円(器いっぱい)。 */
    form?: (typeof META.props.form.values)[number];
  }
  let { form = META.props.form.default }: Props = $props();
</script>

<!-- 支援技術から常に隠す(Skeleton.md §3。代役は情報ではない。「読み込み中」は包む領域が伝える)。
     寸法は自分で持たない: text は font に、box/circle は器に従う(§2)。reduced-motion は CSS で停止。 -->
<div class="sc-skeleton" data-form={form} aria-hidden="true"></div>
