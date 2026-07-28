/**
 * 生成される適合検査は props と必須トークンの CSS 参照しか照合しない(HOLES #19)。
 * ここでは構造(部品が自分で基準を持つこと、DOM の順)と、位置と層の配線を守る。
 */
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Imposter from './Imposter.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const base = snip('<img alt="" src="x.png" />');
const kids = snip('<span>売り切れ</span>');
const root = (c: HTMLElement) => c.querySelector('.sc-imposter') as HTMLElement;
const overlay = (c: HTMLElement) => c.querySelector('.sc-imposter-overlay') as HTMLElement;

it('部品が下地と重ねの両方を持つ(基準を祖先に求めない。Imposter.md §2)', () => {
  const { container } = render(Imposter, { props: { base, children: kids } });
  expect(root(container).querySelector('img')).not.toBeNull();
  expect(overlay(container).textContent).toBe('売り切れ');
});

it('DOM の順は下地が先、重ねが後(視覚の重なりと読み上げの順を入れ替えない)', () => {
  const { container } = render(Imposter, { props: { base, children: kids } });
  const nodes = [...root(container).childNodes].filter((n) => n.nodeType === 1) as Element[];
  expect(nodes[0]?.tagName).toBe('IMG');
  expect(nodes.at(-1)?.className).toBe('sc-imposter-overlay');
});

it('位置の既定は両軸とも中央', () => {
  const { container } = render(Imposter, { props: { base, children: kids } });
  expect(overlay(container).dataset.alignBlock).toBe('center');
  expect(overlay(container).dataset.alignInline).toBe('center');
});

it('位置は論理の3×3を data 属性で表す', () => {
  for (const alignBlock of ['start', 'center', 'end'] as const) {
    for (const alignInline of ['start', 'center', 'end'] as const) {
      const { container } = render(Imposter, { props: { base, children: kids, alignBlock, alignInline } });
      expect(overlay(container).dataset.alignBlock).toBe(alignBlock);
      expect(overlay(container).dataset.alignInline).toBe(alignInline);
    }
  }
});

it('layer は省略時に宣言しない(新しい層を作らない。第3条の抑制)', () => {
  const { container } = render(Imposter, { props: { base, children: kids } });
  expect(overlay(container).dataset.layer).toBeUndefined();
});

it('layer を渡すと層の重ね順を取る', () => {
  const { container } = render(Imposter, { props: { base, children: kids, layer: 'popover' } });
  expect(overlay(container).dataset.layer).toBe('popover');
});

it('外箱は既定が div、行内モードでは span(Web 固有の取り決め。Imposter.md §3)', () => {
  const { container } = render(Imposter, { props: { base, children: kids } });
  expect(root(container).tagName).toBe('DIV');
  expect(overlay(container).tagName).toBe('DIV');
  const { container: c2 } = render(Imposter, { props: { base, children: kids, inline: true } });
  expect(root(c2).tagName).toBe('SPAN');
  expect(overlay(c2).tagName).toBe('SPAN');
});
