<script lang="ts">
  import './Message.css';
  import { META, type MessageAlign, type MessageColor, type MessageRole, type MessageVariant } from './meta';
  import type { Snippet } from 'svelte';

  // 会話のひと続きの発話(Message.md)。conversation §2 の primitive は role を帯びた content unit の列で、
  // turn はその列に対する描画時の view である。器はその view を一つ描くだけで、中身は解釈しない
  // (part の集合は閉じている。part ごとの描画を器が持つと data のパススルーを受け取れなくなる)。
  interface Props {
    /** この発話の話者(conversation §2 の閉集合)。帰属であって見た目ではない。 */
    role?: MessageRole;
    /** 面の量(emphasis.md §3 の4段)。器は role から姿を導かないので、変えたい消費者が渡す。 */
    variant?: MessageVariant;
    /** 面と文字の intent。ブランド色の吹き出し(LINE の緑、iMessage の青)は primary が担う。 */
    color?: MessageColor;
    /** 行のどちら側へ寄せるか(Cluster と同じ語彙)。自分の発話を行末側へ置くなら end。 */
    align?: MessageAlign;
    /** 話者の名前(支援技術がこの発話を名指すのに使う)。DS は文言を持たないので消費者が与える。 */
    speakerLabel: string;
    /** 話者の名乗り(表示名・顔)。省略できる。名前としては speakerLabel が使われる。 */
    speaker?: Snippet;
    /** 発話に添える補助(時刻・状態・操作)。書式は器が持たない。 */
    meta?: Snippet;
    /** 発話の中身。器は解釈しない。 */
    children: Snippet;
  }
  let {
    role = META.props.role.default,
    variant = META.props.variant.default,
    color = META.props.color.default,
    align = META.props.align.default,
    speakerLabel,
    speaker,
    meta,
    children,
  }: Props = $props();
</script>

<!-- 発話は一つのまとまりとして届く(group)。名前は話者から作る(誰の発話かを視覚だけに頼らない。
     conversation §5)。器自身は焦点を受けず、中の押せる要素に焦点と当たり判定が生きる。
     姿は role から導かない: 人間同士のチャットでは発話が全部 user になり、自分と相手の別も
     誰の発話かも role からは出てこない(Message.md §2)。 -->
<div
  class="sc-message"
  data-role={role}
  data-variant={variant}
  data-color={color}
  data-align={align}
  role="group"
  aria-label={speakerLabel}
>
  {#if speaker}<div class="sc-message-speaker">{@render speaker()}</div>{/if}
  <div class="sc-message-body">
    <div class="sc-message-content">{@render children()}</div>
    {#if meta}<div class="sc-message-meta">{@render meta()}</div>{/if}
  </div>
</div>
