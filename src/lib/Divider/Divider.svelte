<script lang="ts">
  import './Divider.css';
  import { META } from './meta';

  // 区切る線。内容を持たない(Divider.md §1)。余白で足りるなら線を引かない、が既定の答え(第3条)。
  interface Props {
    /** 何の流れを切るか。stack=積み(横書きで水平線)、inline=並び(同・垂直線)。論理方向(layout.md §7)。 */
    orientation?: (typeof META.props.orientation.values)[number];
  }
  let { orientation = META.props.orientation.default }: Props = $props();
</script>

<!-- 既定は装飾。支援技術から隠す(Divider.md §3。native <hr> の露出既定からの意図的逸脱。
     読み上げで「区切り」を連呼させない。意味のある境界は見出し構造が運ぶ)。余白は持たない
     (線の周りの間隔は置かれた場所=Stack の gap が所有する。layout.md §1)。 -->
<div class="sc-divider" data-orientation={orientation} aria-hidden="true"></div>
