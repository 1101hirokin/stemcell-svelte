import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Disclosure from './Disclosure.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const summary = snip('<span>配送について</span>');
const content = snip('<p>注文から3営業日で発送します</p>');

// 生成検査は props と tokensRequired しか照合しない(HOLES #19)。
// 値の所有(open はアプリのもの)と a11y の配線はここで守る。
describe('Disclosure', () => {
  it('トリガーは button の意味論を持ち、summary が名前になる', () => {
    render(Disclosure, { summary, content });
    // native の <summary> は button 相当として公開される
    const trigger = screen.getByText('配送について').closest('summary');
    expect(trigger).toBeTruthy();
    expect(trigger?.textContent).toContain('配送について');
  });

  it('open は既定で false(畳んだ状態)', () => {
    const { container } = render(Disclosure, { summary, content });
    expect((container.querySelector('details') as HTMLDetailsElement).open).toBe(false);
  });

  it('open=true で開く', () => {
    const { container } = render(Disclosure, { summary, content, open: true });
    expect((container.querySelector('details') as HTMLDetailsElement).open).toBe(true);
  });

  it('トリガーの操作は openchange を発火する(値の更新はアプリ。state.md §6)', async () => {
    const onopenchange = vi.fn();
    const { container } = render(Disclosure, { summary, content, onopenchange });
    await fireEvent.click(container.querySelector('summary') as HTMLElement);
    expect(onopenchange).toHaveBeenCalledWith(true);
  });

  it('開いているときの操作は閉じる要求を出す', async () => {
    const onopenchange = vi.fn();
    const { container } = render(Disclosure, { summary, content, open: true, onopenchange });
    await fireEvent.click(container.querySelector('summary') as HTMLElement);
    expect(onopenchange).toHaveBeenCalledWith(false);
  });

  it('トリガーが content を指す(aria-controls。native は張らないので補う)', () => {
    const { container } = render(Disclosure, { summary, content });
    const id = container.querySelector('summary')?.getAttribute('aria-controls');
    expect(id).toBeTruthy();
    expect(container.querySelector(`#${id}`)?.textContent).toContain('3営業日');
  });

  it('summary と content は兄弟である(対話要素の入れ子にしない。契約 a11y)', () => {
    const { container } = render(Disclosure, { summary, content });
    const summaryEl = container.querySelector('summary') as HTMLElement;
    const contentEl = container.querySelector('.sc-disclosure-content') as HTMLElement;
    expect(summaryEl.contains(contentEl)).toBe(false);
    expect(summaryEl.parentElement).toBe(contentEl.parentElement);
  });
});
