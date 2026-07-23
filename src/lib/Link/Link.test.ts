import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Link from './Link.svelte';

const label = createRawSnippet(() => ({ render: () => '<span>詳細</span>' }));

it('native <a href> として描画され role=link を native から得る(Link.md §1)', () => {
  render(Link, { props: { href: '/docs', children: label } });
  const a = screen.getByRole('link') as HTMLAnchorElement;
  expect(a.tagName).toBe('A');
  expect(a.getAttribute('href')).toBe('/docs');
  expect(a.textContent).toContain('詳細');
});

it('disabled を持たない(native <a> に無効化は無い。Link.md §2)', () => {
  render(Link, { props: { href: '/docs', children: label } });
  const a = screen.getByRole('link');
  expect(a.hasAttribute('disabled')).toBe(false);
  expect(a.getAttribute('aria-disabled')).toBeNull();
});

it('既定(external=false)は同文脈遷移: target も rel も外部アイコンも持たない', () => {
  const { container } = render(Link, { props: { href: '/docs', children: label } });
  const a = screen.getByRole('link');
  expect(a.getAttribute('target')).toBeNull();
  expect(a.getAttribute('rel')).toBeNull();
  expect(container.querySelector('.sc-link-external')).toBeNull();
  expect(container.querySelector('.sc-link-sr-only')).toBeNull();
});

it('external=true は native の新文脈遷移(target=_blank)と reverse-tabnabbing 防御(rel=noopener のみ)を得る(第2条。Link.md §2)', () => {
  render(Link, { props: { href: 'https://x.example', external: true, children: label } });
  const a = screen.getByRole('link');
  expect(a.getAttribute('target')).toBe('_blank');
  // noopener だけ(noreferrer は付けない: referrer 抹消は仕様が正当化していない副作用)
  expect(a.getAttribute('rel')).toBe('noopener');
});

it('external の視覚アイコンは house の Icon(装飾なので aria-hidden)、告知は視覚的に隠した文字が担う(Link.md §3)', () => {
  const { container } = render(Link, {
    props: { href: 'https://x.example', external: true, children: label },
  });
  // グリフ直書きでなく Icon SSOT を使う(同期の glyph 経路で svg.sc-icon が出る)
  const icon = container.querySelector('.sc-link-external .sc-icon') as SVGElement;
  expect(icon).not.toBeNull();
  expect(icon.getAttribute('aria-hidden')).toBe('true');
  const sr = container.querySelector('.sc-link-sr-only') as HTMLElement;
  expect(sr.textContent).toBe('(opens in new tab)');
});

it('newTabLabel でロケールを上書きできる(Web 層の逃げ道。第4条)', () => {
  const { container } = render(Link, {
    props: { href: 'https://x.example', external: true, newTabLabel: '(新しいタブで開く)', children: label },
  });
  expect((container.querySelector('.sc-link-sr-only') as HTMLElement).textContent).toBe('(新しいタブで開く)');
});
