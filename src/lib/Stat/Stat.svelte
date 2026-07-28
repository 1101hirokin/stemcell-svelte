<script lang="ts">
  import './Stat.css';
  import { META, type StatColor, type StatTrend } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import type { Snippet } from 'svelte';

  // 一つの指標(Stat.md)。指標は読むためではなく比べるために置かれるので、揃うことと変化の向きが
  // 読めることが部品の仕事になる。値は整形済みの文字列で受け取る(書式は地域と通貨の政策)。
  interface Props {
    /** 変化の向き。良し悪しは含まない(増えたら悪い指標が同じだけ実在する)。 */
    trend?: StatTrend;
    /** 変化の評価(intent)。部品は向きから導かない。変化の部分にだけ効く。 */
    color?: StatColor;
    /** 何の数かを言う名前。読み上げで数字だけが流れても意味を持たない。 */
    label: Snippet;
    /** 値。整形済みの文字列で受け取る。 */
    value: Snippet;
    /** 変化や期間の補足。変化の意味を運ぶのはこの文字である。 */
    support?: Snippet;
  }
  let { trend, color = META.props.color.default, label, value, support }: Props = $props();

  const uid = $props.id();
  const labelId = `${uid}-label`;

  // 向きの印は装飾。意味は support の文字が運ぶ(色だけにも記号だけにも頼らない。SC 1.4.1)
  const MARK = { up: 'arrow.up', down: 'arrow.down', flat: 'arthmetic.minus' } as const;

  // 向きだけを渡した指標は、目で見える利用者にだけ矢印が出て、それ以外には何も届かない
  // (印は支援技術から外してあり、色は見えない)。契約 alpha.1 が support を必須にした
  $effect(() => {
    if (trend && !support) {
      console.warn(
        '[stemcell] Stat: trend を渡すなら support も要る(Stat.md §2)。' +
          '印は装飾で色は見えない利用者が居るため、変化は文字でも言う(WCAG 2.2 SC 1.4.1)。',
      );
    }
  });
</script>

<!-- 名前と値は一つのまとまりとして届き、まとまりの名前は見えている名前が与える(指標を格子に
     並べた画面で、支援技術が指標を単位として渡り歩ける。契約 alpha.1)。 -->
<div class="sc-stat" data-color={color} data-trend={trend} role="group" aria-labelledby={labelId}>
  <div class="sc-stat-label" id={labelId}>{@render label()}</div>
  <!-- 値は字幅の揃った数字で描く(typography.md §5 の数字の揃え)。桁がずれた数の列は大小が読めない -->
  <div class="sc-stat-value">{@render value()}</div>
  {#if trend || support}
    <div class="sc-stat-support">
      {#if trend}<span class="sc-stat-trend"><Icon name={MARK[trend]} /></span>{/if}
      {#if support}{@render support()}{/if}
    </div>
  {/if}
</div>
