<script lang="ts">
  import './Stat.css';
  import { META, type StatColor, type StatTrend } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import type { Snippet } from 'svelte';

  // 一つの指標(Stat.md)。指標は読むためではなく比べるために置かれるので、揃うことと変化の向きが
  // 読めることが器の仕事になる。値は整形済みの文字列で受け取る(書式は地域と通貨の政策)。
  interface Props {
    /** 変化の向き。良し悪しは含まない(増えたら悪い指標が同じだけ実在する)。 */
    trend?: StatTrend;
    /** 変化の評価(intent)。器は向きから導かない。変化の部分にだけ効く。 */
    color?: StatColor;
    /** 何の数かを言う名前。読み上げで数字だけが流れても意味を持たない。 */
    label: Snippet;
    /** 値。整形済みの文字列で受け取る。 */
    value: Snippet;
    /** 変化や期間の補足。変化の意味を運ぶのはこの文字である。 */
    support?: Snippet;
  }
  let { trend, color = META.props.color.default, label, value, support }: Props = $props();

  // 向きの印は装飾。意味は support の文字が運ぶ(色だけにも記号だけにも頼らない。SC 1.4.1)
  const MARK = { up: 'arrow.up', down: 'arrow.down', flat: 'arthmetic.minus' } as const;
</script>

<div class="sc-stat" data-color={color} data-trend={trend}>
  <div class="sc-stat-label">{@render label()}</div>
  <!-- 値は字幅の揃った数字で描く(typography.md §5 の数字の揃え)。桁がずれた数の列は大小が読めない -->
  <div class="sc-stat-value">{@render value()}</div>
  {#if trend || support}
    <div class="sc-stat-support">
      {#if trend}<span class="sc-stat-trend"><Icon name={MARK[trend]} /></span>{/if}
      {#if support}{@render support()}{/if}
    </div>
  {/if}
</div>
