/**
 * 実装側テスト。適合テスト(自動生成)が照合できない配線と挙動を検証する:
 * label/description/error の a11y 配線、change の逐次性、native 確定 change の遮断
 * (field.md §5 の Lit/Svelte 非対称への申し送り)、readonly×invalid の排他。
 */
import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import TextField from './TextField.svelte';
import RejectDigits from './fixtures/RejectDigits.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const label = snip('<span>氏名</span>');
const input = (c: HTMLElement) => c.querySelector('.sc-textfield-input') as HTMLInputElement;

it('フィールドは fill(横いっぱい)の宣言を持つ(field.md §2・layout.md §2。裁定 2026-07)', () => {
  // jsdom はレイアウトを計算しないため、出荷される CSS の宣言を直接検査する
  // (conformance が tokensRequired の CSS 変数を照合するのと同じ手法)。実際の描画幅は smoke が測る。
  const css = readFileSync(join(import.meta.dirname, 'TextField.css'), 'utf-8');
  const block = css.slice(css.indexOf('.sc-textfield {'), css.indexOf('}', css.indexOf('.sc-textfield {')));
  expect(block).toContain('inline-size: 100%');
  expect(block).toContain('min-inline-size: 0');
});

it('label: for/id で input の名前として配線される(field.md §2)', () => {
  const { container } = render(TextField, { props: { label } });
  const el = container.querySelector('.sc-textfield-label') as HTMLLabelElement;
  expect(el.getAttribute('for')).toBe(input(container).id);
  expect(el.textContent).toContain('氏名');
});

it('change: 逐次(毎入力)で発火し、payload は新しい値(field.md §5)', async () => {
  const onchange = vi.fn();
  const { container } = render(TextField, { props: { label, onchange } });
  await fireEvent.input(input(container), { target: { value: 'あい' } });
  expect(onchange).toHaveBeenCalledTimes(1);
  expect(onchange).toHaveBeenCalledWith('あい');
});

it('native の確定 change は部品の外へ漏れない(field.md §5: Svelte は light DOM のため構造的保護が無い。実装が止める)', async () => {
  const onchange = vi.fn();
  const outer = vi.fn();
  const { container } = render(TextField, { props: { label, onchange } });
  container.addEventListener('change', outer);
  await fireEvent.change(input(container), { target: { value: '確定' } });
  expect(outer, '確定 change が light DOM を伝播した').not.toHaveBeenCalled();
  expect(onchange, '確定 change が契約の change に化けた').not.toHaveBeenCalled();
  container.removeEventListener('change', outer);
});

it('description と error は並置され、両方が aria-describedby で説明として届く(field.md §3)', () => {
  const { container } = render(TextField, {
    props: {
      label,
      invalid: true,
      description: snip('<span>8文字以上</span>'),
      error: snip('<span>短すぎる</span>'),
    },
  });
  const desc = container.querySelector('.sc-textfield-description') as HTMLElement;
  const err = container.querySelector('.sc-textfield-error') as HTMLElement;
  expect(desc.textContent).toContain('8文字以上');
  expect(err.textContent).toContain('短すぎる');
  const ids = (input(container).getAttribute('aria-describedby') ?? '').split(' ');
  expect(ids).toContain(desc.id);
  expect(ids).toContain(err.id);
});

it('error 部位は invalid のときだけ現れる(field.md §2: error の必須条件は invalid)', () => {
  const { container } = render(TextField, {
    props: { label, invalid: false, error: snip('<span>短すぎる</span>') },
  });
  expect(container.querySelector('.sc-textfield-error')).toBeNull();
});

it('invalid: aria-invalid が状態として届き、intent が danger へ差し替わる(data-invalid)', () => {
  const { container } = render(TextField, { props: { label, invalid: true } });
  expect(input(container).getAttribute('aria-invalid')).toBe('true');
  expect((container.querySelector('.sc-textfield') as HTMLElement).dataset.invalid).toBe('true');
});

it('readonly×invalid: 同時に成立しない(state.md §6)。warn して invalid を落とす', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { container } = render(TextField, { props: { label, readonly: true, invalid: true } });
  expect(input(container).readOnly).toBe(true);
  expect(input(container).getAttribute('aria-invalid')).toBeNull();
  expect(warn.mock.calls.some((c) => String(c[0]).includes('readonly と invalid'))).toBe(true);
  warn.mockRestore();
});

it('required: native 属性で届き、視覚標示を部品が自動で出す(field.md §4。記号は aria-hidden)', () => {
  const { container } = render(TextField, { props: { label, required: true } });
  expect(input(container).required).toBe(true);
  const marker = container.querySelector('.sc-textfield-required') as HTMLElement;
  expect(marker.getAttribute('aria-hidden')).toBe('true');
});

it('値の所有(bind): アプリが差し戻した値は DOM へも反映される(field.md §5。独立レビュー指摘 blocker の検証)', async () => {
  const { container, getByTestId } = render(RejectDigits);
  expect(input(container).value).toBe('abc');
  await fireEvent.input(input(container), { target: { value: 'abc1' } });
  expect(getByTestId('app-value').textContent, 'アプリ側の値').toBe('abc');
  expect(input(container).value, 'DOM 側の値').toBe('abc');
});

it('値の所有(非 bind): 入力後でも value prop の更新は DOM へ流れる(アプリからのリセット)', async () => {
  const { container, rerender } = render(TextField, { props: { label, value: 'abc' } });
  await fireEvent.input(input(container), { target: { value: 'abc1' } });
  expect(input(container).value).toBe('abc1');
  await rerender({ value: '' });
  expect(input(container).value).toBe('');
});

it('disabled / placeholder / autocomplete / keyboard は native 属性へ写る(契約の mirrorsNativeAttr)', () => {
  const { container } = render(TextField, {
    props: {
      label,
      disabled: true,
      placeholder: '例: 山田太郎',
      autocomplete: 'name',
      keyboard: 'email',
    },
  });
  const el = input(container);
  expect(el.disabled).toBe(true);
  expect(el.getAttribute('placeholder')).toBe('例: 山田太郎');
  expect(el.getAttribute('autocomplete')).toBe('name');
  expect(el.getAttribute('inputmode')).toBe('email');
});

// 消す操作(TextField.md §2 / RFC 0021)
describe('clearable', () => {
  const clearBtn = (c: HTMLElement) => c.querySelector('.sc-field-clear') as HTMLButtonElement | null;

  it('値があるときだけ現れる(空の欄に押せない印を残さない)', async () => {
    const { container, rerender } = render(TextField, {
      props: { label: snip('<span>探す</span>'), clearable: true, clearLabel: '消去', value: '' },
    });
    expect(clearBtn(container)).toBe(null);
    await rerender({ label: snip('<span>探す</span>'), clearable: true, clearLabel: '消去', value: '土鍋' });
    expect(clearBtn(container)?.getAttribute('aria-label')).toBe('消去');
  });

  it('押すと値が空になり、焦点は欄に残る', async () => {
    const onchange = vi.fn();
    const { container } = render(TextField, {
      props: { label: snip('<span>探す</span>'), clearable: true, clearLabel: '消去', value: '土鍋', onchange },
    });
    await fireEvent.click(clearBtn(container)!);
    expect(onchange).toHaveBeenLastCalledWith('');
    expect(document.activeElement).toBe(container.querySelector('.sc-textfield-input'));
  });

  it('タブ順に入る(鍵盤からも押せる)', () => {
    const { container } = render(TextField, {
      props: { label: snip('<span>探す</span>'), clearable: true, clearLabel: '消去', value: '土鍋' },
    });
    expect(clearBtn(container)?.getAttribute('tabindex')).toBe(null); // 既定のまま = 順路に載る
  });

  it('Escape で消し、そこで止める(面の Escape へ伝えない)', async () => {
    const onchange = vi.fn();
    const outer = vi.fn();
    const { container } = render(TextField, {
      props: { label: snip('<span>探す</span>'), clearable: true, clearLabel: '消去', value: '土鍋', onchange },
    });
    container.ownerDocument.addEventListener('keydown', outer);
    await fireEvent.keyDown(container.querySelector('.sc-textfield-input')!, { key: 'Escape', bubbles: true });
    expect(onchange).toHaveBeenLastCalledWith('');
    expect(outer).not.toHaveBeenCalled();
    container.ownerDocument.removeEventListener('keydown', outer);
  });

  it('値が空なら Escape は外へ抜ける(面が閉じられなくならない)', async () => {
    const outer = vi.fn();
    const { container } = render(TextField, {
      props: { label: snip('<span>探す</span>'), clearable: true, clearLabel: '消去', value: '' },
    });
    container.ownerDocument.addEventListener('keydown', outer);
    await fireEvent.keyDown(container.querySelector('.sc-textfield-input')!, { key: 'Escape', bubbles: true });
    expect(outer).toHaveBeenCalled();
    container.ownerDocument.removeEventListener('keydown', outer);
  });

  it('消す操作は end に消費者が置いたものより内側(欄寄り)に立つ', () => {
    const { container } = render(TextField, {
      props: { label: snip('<span>探す</span>'), clearable: true, clearLabel: '消去', value: '土鍋', end: snip('<span>件</span>') },
    });
    const kids = [...container.querySelectorAll('.sc-textfield-control > *')].map((n) => n.className);
    expect(kids.indexOf('sc-field-clear')).toBeLessThan(kids.indexOf('sc-textfield-end'));
  });

  it('欄の中の押せる付属は正方形になる(一辺は欄の行高)', () => {
    // jsdom はレイアウトを計算しないので、出荷される CSS の宣言を検査する
    const css = readFileSync(join(import.meta.dirname, '../internal/field-button.css'), 'utf-8');
    expect(css).toContain('inline-size: var(--sc-field-side)');
    expect(css).toContain('align-self: stretch');
    // 一辺は「打つ文字の1行 + 縦の inset 二つ分」で組み立てる(器の高さと同じ式)
    expect(css).toContain('--typography-body-md-line-height');
    expect(css).toContain('var(--_inset, var(--spacing-inset-md)) * 2');
    // 角は丸めない(器の曲がりとずれる)
    expect(css).toContain('border-radius: 0');
  });

  it('打てない欄(disabled / readonly)では出さない', () => {
    const { container } = render(TextField, {
      props: { label: snip('<span>探す</span>'), clearable: true, clearLabel: '消去', value: '土鍋', readonly: true },
    });
    expect(clearBtn(container)).toBe(null);
  });
});
