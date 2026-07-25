import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Badge from './Badge.svelte';

it('既定は info / filled で、count を数として描く(Badge.md §2)', () => {
  const { container } = render(Badge, { props: { count: 3 } });
  const b = container.querySelector('.sc-badge') as HTMLElement;
  expect(b.dataset.color).toBe('info');
  expect(b.dataset.variant).toBe('filled');
  expect(b.textContent).toBe('3');
});

it('count が max を超えると「{max}+」へ丸める。存在(dot)へは降格しない(§2)', () => {
  const { container } = render(Badge, { props: { count: 120, max: 99 } });
  const b = container.querySelector('.sc-badge') as HTMLElement;
  expect(b.textContent).toBe('99+');
  expect(b.dataset.dot).toBe('false'); // 量のまま。桁あふれで dot へ自動降格しない
});

it('count=0 は描く(「無」ではない。空になるのは count 無し・dot 無しのときだけ)', () => {
  const { container } = render(Badge, { props: { count: 0 } });
  expect((container.querySelector('.sc-badge') as HTMLElement).textContent).toBe('0');
});

it('count 無し・dot 無しは何も描かない(空の Badge は無を意味する。契約 a11y)', () => {
  const { container } = render(Badge, { props: {} });
  expect(container.querySelector('.sc-badge')).toBeNull();
});

it('dot は数を出さず、label を視覚に隠した文字で支援技術へ届ける(§3)', () => {
  const { container } = render(Badge, { props: { dot: true, label: '新着あり' } });
  const b = container.querySelector('.sc-badge') as HTMLElement;
  expect(b.dataset.dot).toBe('true');
  expect(b.textContent).toBe('新着あり'); // sr-only の文字(視覚には出ないが DOM にはある)
  const sr = container.querySelector('.sc-badge-sr') as HTMLElement;
  expect(sr).not.toBeNull();
});

it('color / variant を data 属性で持つ', () => {
  const { container } = render(Badge, { props: { count: 1, color: 'danger', variant: 'soft' } });
  const b = container.querySelector('.sc-badge') as HTMLElement;
  expect(b.dataset.color).toBe('danger');
  expect(b.dataset.variant).toBe('soft');
});

it('anchor(children)があると重ねの原始(Imposter)で包む。無ければ単独で並ぶ', () => {
  const anchor = createRawSnippet(() => ({ render: () => '<button>通知</button>' }));
  const { container } = render(Badge, { props: { count: 5, children: anchor } });
  const wrap = container.querySelector('.sc-imposter') as HTMLElement;
  expect(wrap).not.toBeNull();
  expect(wrap.querySelector('button')).not.toBeNull();
  expect(wrap.querySelector('.sc-badge')).not.toBeNull();
  const { container: solo } = render(Badge, { props: { count: 5 } });
  expect(solo.querySelector('.sc-imposter')).toBeNull();
  expect(solo.querySelector('.sc-badge')).not.toBeNull();
});

it('anchor の隅は block 軸 start × inline 軸 end(Badge.md §5。隅は Imposter が与える)', () => {
  const anchor = createRawSnippet(() => ({ render: () => '<button>通知</button>' }));
  const { container } = render(Badge, { props: { count: 5, children: anchor } });
  const overlay = container.querySelector('.sc-imposter-overlay') as HTMLElement;
  expect(overlay.dataset.alignBlock).toBe('start');
  expect(overlay.dataset.alignInline).toBe('end');
  // 行内の操作子に重ねるので外箱は行内モード(Imposter.md §3)
  expect((container.querySelector('.sc-imposter') as HTMLElement).tagName).toBe('SPAN');
  // 半分はみ出す量だけが Badge 側に残る
  expect((container.querySelector('.sc-badge') as HTMLElement).dataset.anchored).toBe('true');
});

it('anchor があり印が無い(count 無し・dot 無し)ときは、anchor だけ描いて印は出さない', () => {
  const anchor = createRawSnippet(() => ({ render: () => '<button>通知</button>' }));
  const { container } = render(Badge, { props: { children: anchor } });
  const wrap = container.querySelector('.sc-imposter') as HTMLElement;
  expect(wrap).not.toBeNull();
  expect(wrap.querySelector('button')).not.toBeNull();
  expect(wrap.querySelector('.sc-badge')).toBeNull();
});

it('押せない: role を持たず、フォーカス不可(読むものであって押すものではない)', () => {
  const { container } = render(Badge, { props: { count: 3 } });
  const b = container.querySelector('.sc-badge') as HTMLElement;
  expect(b.getAttribute('role')).toBeNull();
  expect(b.tabIndex).toBeLessThan(0);
});
