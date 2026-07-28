<script lang="ts">
  import './DropArea.css';
  import { META } from './meta';
  import { filesFrom, splitByAccept } from '../internal/files';
  import type { Snippet } from 'svelte';

  // ファイルを落とせる面(DropArea.md)。落ちたものを知らせるだけで、値は持たない。
  // 落として入れる形だけでは、ポインタを引きずれない利用者に届かない。押して選べる手段
  // (FileField)を中へ置くこと(WCAG 2.2 SC 2.5.7)。
  interface Props {
    /** 受け入れる種類。語彙は FileField と同じ(MIME 型の列)。 */
    accept?: string[];
    disabled?: boolean;
    /** 面の名前。中の文言を名前として使えない場合に渡す。 */
    label?: string;
    /** ファイルが落ちた。受け取った側が値へ足す。 */
    ondrop?: (files: File[]) => void;
    /** accept に合わないものが落ちた。 */
    onreject?: (files: File[]) => void;
    children: Snippet;
  }
  let {
    accept,
    disabled = META.props.disabled.default,
    label,
    ondrop,
    onreject,
    children,
  }: Props = $props();

  // 落ちてくる最中は状態である(RFC 0022)。持ち物の有無で次に起きることが違うので hover とは別。
  // 出入りが子の上でも起きるので、深さを数える(dragleave が子へ移るたびに飛ぶ)
  let depth = $state(0);
  const over = $derived(depth > 0 && !disabled);

  const ondragenter = (e: DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    depth += 1;
  };
  const ondragover = (e: DragEvent) => {
    if (disabled) return;
    e.preventDefault(); // これが無いと落とせない(既定は拒否)
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };
  const ondragleave = () => {
    depth = Math.max(0, depth - 1);
  };
  const drop = (e: DragEvent) => {
    depth = 0;
    if (disabled) return;
    e.preventDefault();
    const files = filesFrom(e.dataTransfer);
    if (files.length === 0) return;
    const { accepted, rejected } = splitByAccept(files, accept);
    if (accepted.length > 0) ondrop?.(accepted);
    if (rejected.length > 0) onreject?.(rejected);
  };
</script>

<!-- 面そのものは焦点を受けない。焦点を受けるのは中に置かれた操作である。
     role は group にする: この面は「落とす」ためのまとまりであって、押せるものではない。
     押して選ぶ手段は中の FileField が持つ(WCAG 2.2 SC 2.5.7) -->
<div
  class="sc-droparea"
  role="group"
  data-dragover={over}
  data-disabled={disabled}
  aria-label={label}
  aria-disabled={disabled ? 'true' : undefined}
  {ondragenter}
  {ondragover}
  {ondragleave}
  ondrop={drop}
>
  {@render children()}
</div>
