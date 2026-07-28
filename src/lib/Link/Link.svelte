<script lang="ts">
  import './Link.css';
  import '../internal/visually-hidden.css';
  import { META, WEB } from './meta';
  import Icon from '../Icon/Icon.svelte';
  import openNewTab from '@stemcell/icons/open_newtab';
  import type { Snippet } from 'svelte';

  // 場所が変わる(Link.md §1)。native <a href> を土台にする: role=link・Enter 活性化・フォーカスは標準が
  // 無償で与える(憲法 第2条)。その場で起きる行動は Button の仕事。文字の一種なので大きさ・字面を自分で
  // 主張せず周囲の役を継承する(§2。ゆえに variant/size/typography を持たない)。disabled も持たない:
  // href の無い <a> はもうリンクではない、という native の意味論をなぞる(§2)。
  interface Props {
    /** 行き先(必須)。native の href に一致するが観念は「遷移先」。 */
    href: string;
    /** 別文脈への遷移(新しいタブ・アプリ外)を示すオプトイン(§2。href からの自動判定はしない)。 */
    external?: boolean;
    /** external のとき支援技術へ告知する文言(Web 層。i18n は消費者が上書き。Link.md §2)。 */
    newTabLabel?: string;
    children: Snippet;
  }
  let {
    href,
    external = META.props.external.default,
    newTabLabel = WEB.newTabLabel.default,
    children,
  }: Props = $props();
</script>

<!-- external は native の新文脈遷移(target=_blank)と、rel=noopener でタブ乗っ取り(reverse tabnabbing)を
     塞ぐ native の防御を無償で得る(第2条)。noreferrer は付けない: 仕様が正当化したのは乗っ取り対策だけで、
     referrer の抹消は別の副作用(Link.md §2)。示し方は Expressive(非色アイコン。§2)で、house の Icon SSOT を
     使う(グリフの直書きを避ける。iconography.md)。Icon が装飾なら aria-hidden を自ら付け、告知は視覚的に
     隠した文字が Normative に担う(§3)。 -->
<a
  class="sc-link"
  {href}
  target={external ? '_blank' : undefined}
  rel={external ? 'noopener' : undefined}
>{@render children()}{#if external}<span class="sc-link-external"><Icon glyph={openNewTab} /></span><span class="sc-link-sr-only sc-visually-hidden">{newTabLabel}</span>{/if}</a>
