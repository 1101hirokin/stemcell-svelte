<script lang="ts" module>
  /**
   * as の許可リスト。多相の目的は「意味的要素へ」(layout.md §6)であり、部品になりうる
   * 意味的要素だけを開く。型(keyof HTMLElementTagNameMap)は script / style / iframe も
   * 通してしまい、実行時検証が無いと危険要素をそのまま生成できる(独立レビューが実測で指摘)。
   */
  const AS_ALLOWED = [
    'div', 'span', 'section', 'article', 'aside', 'nav', 'main', 'header', 'footer',
    'figure', 'figcaption', 'address', 'p', 'blockquote', 'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'details', 'summary', 'search', 'fieldset', 'form',
  ] as const;
</script>

<script lang="ts">
  import './Box.css';
  import { isTier, isGlobalPrimitive, warnSpacing } from '../internal/spacing';
  import type { Snippet } from 'svelte';

  interface Props {
    /** 内側余白。spacing の語彙: 段(sm / md / lg)または大域の原始 X(8〜24)。1値で全周、空白区切りの
     *  2値で「縦 横」(block inline)を別に指定できる(例 inset="md sm")。省略時は余白なし。 */
    inset?: string;
    /**
     * 逃げ道(契約外 = Svelte の土地の声)。layout.md §6: Box のみ最高自由度を持ち、
     * as 多相(意味的要素へ)と自由 style を許す唯一の逃げ道。素の div の直接使用は非推奨で、
     * 素の部品が欲しいケースはここに集約する。トークン値の使用を推奨(自由な指定は最終手段)。
     */
    as?: (typeof AS_ALLOWED)[number];
    style?: string;
    class?: string;
    children: Snippet;
  }
  let { inset, as = 'div', style, class: klass, children }: Props = $props();

  // 段(sm/md/lg)は inset トークン、大域の原始 X(8〜24)は大域トークンへ解決する。語彙外は null。
  const resolveToken = (t: string): string | null =>
    isTier(t) ? `var(--spacing-inset-${t})` : isGlobalPrimitive(t) ? `var(--spacing-${t})` : null;

  const tokens = $derived(inset !== undefined ? inset.trim().split(/\s+/) : []);
  // 1値: 従来どおり(段は data-inset で CSS、原始は inline)。2値: 「縦 横」を padding-block/inline で当てる。
  const tier = $derived(tokens.length === 1 && isTier(tokens[0]!));
  const primitive = $derived(tokens.length === 1 && !tier && isGlobalPrimitive(tokens[0]!));
  const dualBlock = $derived(tokens.length === 2 ? resolveToken(tokens[0]!) : null);
  const dualInline = $derived(tokens.length === 2 ? resolveToken(tokens[1]!) : null);
  const dualValid = $derived(dualBlock !== null && dualInline !== null);

  const asValid = $derived((AS_ALLOWED as readonly string[]).includes(as));
  $effect(() => {
    if (inset !== undefined && !tier && !primitive && !dualValid) warnSpacing('Box', 'inset', inset, '余白なし');
    if (!asValid) {
      console.warn(
        `[stemcell] Box: as="${as}" は許可された意味的要素ではない。"div" へ退避する(layout.md §6: 多相は意味的要素へ)。`,
      );
    }
  });
</script>

<!-- 見た目と意味を持たない部品(契約 a11y)。意味が要るときは as で意味的要素になる。 -->
<svelte:element
  this={asValid ? as : 'div'}
  class={klass ? `sc-box ${klass}` : 'sc-box'}
  {style}
  data-inset={tier ? tokens[0] : undefined}
  style:padding={primitive ? `var(--spacing-${tokens[0]})` : undefined}
  style:padding-block={dualValid ? dualBlock : undefined}
  style:padding-inline={dualValid ? dualInline : undefined}
>
  {@render children()}
</svelte:element>
