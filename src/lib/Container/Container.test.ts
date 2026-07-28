import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Container from './Container.svelte';

const kids = createRawSnippet(() => ({ render: () => '<p>ページ</p>' }));
const el = (c: HTMLElement) => c.querySelector('.sc-container') as HTMLElement;

it('既定は xl(ページの殻の幅)', () => {
  const { container } = render(Container, { props: { children: kids } });
  expect(el(container).dataset.max).toBe('xl');
});

it('段は data-max で container のトークンを引く。測度(prose)は持たない', () => {
  for (const max of ['sm', 'md', 'lg', 'xl'] as const) {
    const { container } = render(Container, { props: { children: kids, max } });
    expect(el(container).dataset.max).toBe(max);
  }
});

it('左右の最低余白を持つ(狭い画面で文字がページの端に張り付かない。裁定 2026-07-28)', () => {
  const css = readFileSync(join(import.meta.dirname, 'Container.css'), 'utf-8');
  const block = css.slice(css.indexOf('.sc-container {'), css.indexOf('}', css.indexOf('.sc-container {')));
  expect(block).toContain('padding-inline: var(--spacing-inset-lg)');
  // 幅の上限の内側に余白が入る(端まで使い切らない)
  expect(block).toContain('box-sizing: border-box');
});
