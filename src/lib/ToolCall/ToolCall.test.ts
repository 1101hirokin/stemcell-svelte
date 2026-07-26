/**
 * 生成される適合検査は props と必須トークンの CSS 参照しか照合しない(HOLES #19)。
 * ここでは段階が支援技術へ届く配線(role / aria-busy / 割り込み度)を守る。
 */
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import ToolCall from './ToolCall.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const name = snip('<span>web_search</span>');
const input = snip('<code>{"q":"stemcell"}</code>');
const result = snip('<p>3件見つかりました</p>');
const error = snip('<p>ネットワークに接続できません</p>');
const root = (c: HTMLElement) => c.querySelector('.sc-tool-call') as HTMLElement;

it('name が領域の名前になる(無名のツール活動を許さない)', () => {
  const { container } = render(ToolCall, { props: { status: 'busy', name } });
  const el = root(container);
  expect(el.getAttribute('role')).toBe('group');
  const labelledby = el.getAttribute('aria-labelledby');
  expect(container.querySelector(`#${labelledby}`)?.textContent).toBe('web_search');
});

it('busy は領域が aria-busy で伝え、進行の図形は支援技術から隠す(図形が連呼しない)', () => {
  const { container } = render(ToolCall, { props: { status: 'busy', name } });
  expect(root(container).getAttribute('aria-busy')).toBe('true');
  const figure = container.querySelector('.sc-tool-call-busy') as HTMLElement;
  expect(figure.getAttribute('aria-hidden')).toBe('true');
  // 図形は文字を持たない(合成したローダーの隠し文字も空。名前は誰にも届かないので発明しない)
  expect(figure.textContent?.trim()).toBe('');
});

it('待ちの図形は合成した円形の不確定ローダーが描く(待ちの絵を二度描かない)', () => {
  const { container } = render(ToolCall, { props: { status: 'busy', name } });
  const loader = container.querySelector('.sc-tool-call-busy .sc-circularloader') as HTMLElement;
  expect(loader).not.toBeNull();
  // ローダー自身は role=status を持つが、包みが隠すので支援技術には届かない
  expect(loader.getAttribute('role')).toBe('status');
  expect(loader.closest('[aria-hidden="true"]')).not.toBeNull();
});

it('result / error では aria-busy が下りる', () => {
  for (const status of ['result', 'error'] as const) {
    const { container } = render(ToolCall, { props: { status, name, result, error } });
    expect(root(container).getAttribute('aria-busy'), status).toBe('false');
    expect(container.querySelector('.sc-tool-call-busy'), status).toBeNull();
  }
});

it('告知の割り込み度が段階に連動する(error は即時、result は穏当。tool-call §4)', () => {
  const { container } = render(ToolCall, { props: { status: 'busy', name } });
  // live region は最初から DOM に置く(遷移で中身が入る形。後から領域ごと挿入すると拾われないことがある)
  expect(container.querySelector('.sc-tool-call-result')?.getAttribute('role')).toBe('status');
  expect(container.querySelector('.sc-tool-call-error')?.getAttribute('role')).toBe('alert');
});

it('result は status=result のときだけ中身が入る', () => {
  const { container } = render(ToolCall, { props: { status: 'busy', name, result } });
  expect(container.querySelector('.sc-tool-call-result')?.textContent).toBe('');
  const { container: c2 } = render(ToolCall, { props: { status: 'result', name, result } });
  expect(c2.querySelector('.sc-tool-call-result')?.textContent).toContain('3件');
});

it('error は status=error のときだけ中身が入る', () => {
  const { container } = render(ToolCall, { props: { status: 'result', name, result, error } });
  expect(container.querySelector('.sc-tool-call-error')?.textContent).toBe('');
  const { container: c2 } = render(ToolCall, { props: { status: 'error', name, error } });
  expect(c2.querySelector('.sc-tool-call-error')?.textContent).toContain('接続できません');
});

it('input は段階に関わらず示す(引数は呼び出しの一部)', () => {
  for (const status of ['busy', 'result', 'error'] as const) {
    const { container } = render(ToolCall, { props: { status, name, input, result, error } });
    expect(container.querySelector('.sc-tool-call-input')?.textContent, status).toContain('stemcell');
  }
});

it('中身の無い段階は warn する(遷移が視覚だけの出来事になる)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(ToolCall, { props: { status: 'result', name } });
  render(ToolCall, { props: { status: 'error', name } });
  expect(warn.mock.calls.some((c) => String(c[0]).includes('result スロット'))).toBe(true);
  expect(warn.mock.calls.some((c) => String(c[0]).includes('error スロット'))).toBe(true);
  warn.mockRestore();
});

it('段階は data 属性に出る(視覚の切替はここに当たる)', () => {
  const { container } = render(ToolCall, { props: { status: 'error', name, error } });
  expect(root(container).dataset.status).toBe('error');
});
