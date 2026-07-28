<script lang="ts">
  import './Avatar.css';
  import { META } from './meta';

  // 主体の顔(Avatar.md §1)。第7条がそのまま部品に: src 画像 → name のイニシャル、と退避し、どの段でも
  // 寸法・全円・アクセシブルネームは不変。name は画像があっても必須(退避先を常に持つ。§2)。
  interface Props {
    /** 画像の場所(任意)。落ちたらイニシャルへ退く。 */
    src?: string;
    /** 主体の名前(必須)。イニシャルの源であり、アクセシブルネーム。 */
    name: string;
    /** avatar 段の専用チャンネル(24 / 32 / 40px。rem 建てで文字拡大に追従。size.md §2)。 */
    size?: (typeof META.props.size.values)[number];
    /** 支援技術から隠すか(§3)。既定 false は意味を持つ(role=img で name が届く)。隣に可視の名前が
     *  あるとき true にして装飾へ落とし、名前の二重読みを避ける(Icon の label と同型の境界)。 */
    decorative?: boolean;
  }
  let { src, name, size = META.props.size.default, decorative = META.props.decorative.default }: Props = $props();

  // src が落ちたらイニシャルへ退く(native <img> の error。第7条)。失敗した src を憶えることで、src が別の
  // 値へ変われば showImage が同期で true に戻って再試行する($effect も1フレームのちらつきも要らない)。
  let failedSrc = $state<string | undefined>(undefined);
  const showImage = $derived(!!src && src !== failedSrc);

  // イニシャルの切り出し。暫定規則である: Avatar.md §5 は「Normative な共有アルゴリズム」を未確定とし、
  // セット author と同時に確定するとしている。ここは §5 自身の当たり(ラテン=2文字 / 非ラテン=先頭1字)に
  // 寄せた暫定で ratify 待ち。書記素単位で切る(結合文字・絵文字を割らない)。
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const graphemes = (s: string) => [...segmenter.segment(s)].map((g) => g.segment);
  const initials = $derived.by(() => {
    const tokens = name.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return '';
    if (tokens.length >= 2) {
      return (graphemes(tokens[0])[0] + graphemes(tokens[tokens.length - 1])[0]).toUpperCase();
    }
    const g = graphemes(tokens[0]);
    const isLatin = /^[A-Za-z]/.test(tokens[0]);
    return (isLatin ? g.slice(0, 2) : g.slice(0, 1)).join('').toUpperCase();
  });

  // name は必須(イニシャルの源かつアクセシブルネーム)。空だと名前の無い顔になる(Badge の dot と同じく
  // 契約では捕まえきれないので実行時に知らせる)。
  $effect(() => {
    if (name.trim() === '') {
      console.warn('[stemcell] Avatar: name は必須です(イニシャルの源かつアクセシブルネーム。Avatar.md §2)。');
    }
  });
</script>

<!-- 既定(decorative=false)は意味を持つ: 部品が role=img + name を運び、単独で主体を示すときに名前が届く。
     画像は alt=""、イニシャルは aria-hidden で、1つの Avatar 内で名前は二重に読まれない。decorative=true は
     部品ごと支援技術から隠す(隣に可視の名前がある合成。§3)。既定を意味側に倒すのは第1条(指定漏れは冗長で
     済み名前を失わない)。 -->
<span
  class="sc-avatar"
  data-size={size}
  role={decorative ? undefined : 'img'}
  aria-label={decorative ? undefined : name}
  aria-hidden={decorative ? 'true' : undefined}
>
  {#if showImage}
    <img class="sc-avatar-image" {src} alt="" onerror={() => (failedSrc = src)} />
  {:else}
    <span class="sc-avatar-initials" aria-hidden="true">{initials}</span>
  {/if}
</span>
