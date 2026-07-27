import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import CodeBlock from './CodeBlock.svelte';

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const base = { code: 'const a = 1;\nconsole.log(a);', label: 'コード' };

it('空白と改行が保たれ、コードであることが届く(pre + code)', () => {
  const { container } = render(CodeBlock, { props: base });
  const pre = container.querySelector('.sc-codeblock-pre') as HTMLElement;
  const code = container.querySelector('.sc-codeblock-code') as HTMLElement;
  expect(pre.tagName).toBe('PRE');
  expect(code.tagName).toBe('CODE');
  expect(code.textContent).toBe(base.code);
});

it('行は要素になり、文字の中身は元のままである(番号は CSS が数える)', () => {
  const { container } = render(CodeBlock, { props: { ...base, lineNumbers: true } });
  const lines = container.querySelectorAll('.sc-codeblock-line');
  expect(lines.length).toBe(2);
  // 行の中身に番号は入らない。混ざったコードは貼り付けても動かない
  expect(lines[0]!.textContent).toBe('const a = 1;\n');
  expect((container.querySelector('.sc-codeblock-code') as HTMLElement).textContent).toBe(base.code);
});

it('言語は解釈せず印として素通しする', () => {
  const { container } = render(CodeBlock, { props: { ...base, language: 'ts' } });
  expect((container.querySelector('.sc-codeblock-code') as HTMLElement).className).toContain('language-ts');
});

it('着色済みの中身を差せる(複写が渡すのは code のまま)', () => {
  const { container } = render(CodeBlock, { props: { ...base, children: snip('<em>色付き</em>') } });
  expect(container.querySelector('.sc-codeblock-code')!.textContent).toContain('色付き');
  expect(container.querySelector('.sc-codeblock-line')).toBeNull();
});

it('ヘッダーは差されたときだけ出る(切り替えの prop を持たない)', () => {
  const { container } = render(CodeBlock, { props: base });
  expect(container.querySelector('.sc-codeblock-header')).toBeNull();
  const withHeader = render(CodeBlock, { props: { ...base, header: snip('app.ts') } });
  expect(withHeader.container.querySelector('.sc-codeblock-header')!.textContent).toContain('app.ts');
});

it('溢れていなければ焦点を受けない(押せもしない停留所を作らない)', () => {
  const { container } = render(CodeBlock, { props: base });
  const scroller = container.querySelector('.sc-codeblock-scroller') as HTMLElement;
  // jsdom は寸法を持たないので溢れない。名前も領域の役も立たない
  expect(scroller.hasAttribute('tabindex')).toBe(false);
  expect(scroller.getAttribute('role')).toBeNull();
  expect(scroller.getAttribute('aria-label')).toBeNull();
});
