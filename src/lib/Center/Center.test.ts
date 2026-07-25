/**
 * 生成される適合検査は props の名前と値と既定値、そして必須トークンの CSS 参照だけを照合する
 * (HOLES #19)。ここでは段が data 属性として現に出ること(CSS の規則が当たる形になっていること)を守る。
 */
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Center from './Center.svelte';

const kids = createRawSnippet(() => ({ render: () => '<p>本文</p>' }));
const el = (c: HTMLElement) => c.querySelector('.sc-center') as HTMLElement;

it('既定は prose(測度)。fill の唯一の例外という位置づけの既定値', () => {
  const { container } = render(Center, { props: { children: kids } });
  expect(el(container).dataset.max).toBe('prose');
});

it('段は data-max で container のトークンを引く', () => {
  for (const max of ['sm', 'md', 'lg', 'xl', 'prose'] as const) {
    const { container } = render(Center, { props: { children: kids, max } });
    expect(el(container).dataset.max).toBe(max);
  }
});

it('中身をそのまま置く(構造を足さない)', () => {
  const { container } = render(Center, { props: { children: kids } });
  expect(el(container).innerHTML).toContain('<p>本文</p>');
});
