/**
 * 実装側テスト。適合テスト(自動生成)が照合できない配線と挙動を検証する:
 * 「打てる欄は一つ」であること、打てない文字の落とし方、桁が揃ったときの通知、伏せ字と見せ直し。
 */
import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import OneTimeCodeField from './OneTimeCodeField.svelte';
import { sanitize } from './meta';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const label = snip('<span>確認コード</span>');
const input = (c: HTMLElement) => c.querySelector('.sc-otc-input') as HTMLInputElement;
const cells = (c: HTMLElement) => [...c.querySelectorAll('.sc-otc-cell')] as HTMLElement[];

it('打てる欄は一つで、枠は見た目にすぎない(支援技術には一つの欄として届く)', () => {
  const { container } = render(OneTimeCodeField, { props: { label } });
  expect(container.querySelectorAll('input').length).toBe(1);
  expect(cells(container).length).toBe(6); // 既定の桁数
  expect(container.querySelector('.sc-otc-cells')?.getAttribute('aria-hidden')).toBe('true');
});

it('桁の数は消費者が渡し、枠がその数だけ並ぶ', () => {
  const { container } = render(OneTimeCodeField, { props: { label, length: 4 } });
  expect(cells(container).length).toBe(4);
  expect(input(container).getAttribute('maxlength')).toBe('4');
});

it('自動入力の合図と入力様式を器が渡す(消費者は autocomplete を渡さない)', () => {
  const { container } = render(OneTimeCodeField, { props: { label } });
  const el = input(container);
  expect(el.getAttribute('autocomplete')).toBe('one-time-code');
  expect(el.getAttribute('inputmode')).toBe('numeric');
});

it('英数字を許すと、入力様式は文字の鍵盤になる', () => {
  const { container } = render(OneTimeCodeField, { props: { label, charset: 'alphanumeric' } });
  expect(input(container).getAttribute('inputmode')).toBe('text');
});

it('打てない文字は残さない(数字だけのとき、文字は落ちる)', async () => {
  const onchange = vi.fn();
  const { container } = render(OneTimeCodeField, { props: { label, onchange } });
  const el = input(container);
  await fireEvent.input(el, { target: { value: '1a2b3' } });
  expect(onchange).toHaveBeenLastCalledWith('123');
  expect(el.value).toBe('123');
});

it('桁を超えた貼り付けは先頭だけ取る', async () => {
  const onchange = vi.fn();
  const { container } = render(OneTimeCodeField, { props: { label, length: 4, onchange } });
  await fireEvent.input(input(container), { target: { value: '1234567' } });
  expect(onchange).toHaveBeenLastCalledWith('1234');
});

it('桁が揃ったら知らせる(値の変化とは別の通知)', async () => {
  const onchange = vi.fn();
  const oncomplete = vi.fn();
  const { container } = render(OneTimeCodeField, { props: { label, length: 3, onchange, oncomplete } });
  const el = input(container);
  await fireEvent.input(el, { target: { value: '12' } });
  expect(oncomplete).not.toHaveBeenCalled();
  await fireEvent.input(el, { target: { value: '123' } });
  expect(oncomplete).toHaveBeenCalledWith('123');
  expect(onchange).toHaveBeenLastCalledWith('123');
});

it('消して打ち直して再び揃ったら、また知らせる', async () => {
  const oncomplete = vi.fn();
  const { container } = render(OneTimeCodeField, { props: { label, length: 3, oncomplete } });
  const el = input(container);
  await fireEvent.input(el, { target: { value: '123' } });
  await fireEvent.input(el, { target: { value: '12' } });
  await fireEvent.input(el, { target: { value: '124' } });
  expect(oncomplete).toHaveBeenCalledTimes(2);
});

it('伏せると枠の文字は隠れるが、桁の数と埋まった桁は残る', async () => {
  const { container } = render(OneTimeCodeField, {
    props: { label, length: 4, value: '12', masked: true, revealLabel: '表示', concealLabel: '隠す' },
  });
  const texts = cells(container).map((c) => c.textContent);
  expect(texts).toEqual(['•', '•', '', '']);
  expect(cells(container).filter((c) => c.dataset.filled === 'true').length).toBe(2);
});

it('伏せたら見せ直せる。切り替えの結果は文で届き、値は流さない', async () => {
  const { container } = render(OneTimeCodeField, {
    props: {
      label,
      value: '12',
      masked: true,
      revealLabel: '表示',
      concealLabel: '隠す',
      revealedMessage: 'コードを表示しました',
      hiddenMessage: 'コードを隠しました',
    },
  });
  const toggle = container.querySelector('.sc-otc-toggle') as HTMLButtonElement;
  expect(toggle.getAttribute('aria-label')).toBe('表示');
  await fireEvent.click(toggle);
  expect(toggle.getAttribute('aria-label')).toBe('隠す');
  expect(cells(container)[0].textContent).toBe('1');
  const live = container.querySelector('.sc-otc-announcement') as HTMLElement;
  expect(live.getAttribute('role')).toBe('status');
  expect(live.textContent).toBe('コードを表示しました');
});

it('伏せるのに見せ直す名前が無ければ警告する', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(OneTimeCodeField, { props: { label, masked: true } });
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('masked には revealLabel と concealLabel が要る'));
  warn.mockRestore();
});

it('name を渡すとフォーム送信に値が載る(欄が一つなので隠し入力は要らない)', () => {
  const { container } = render(OneTimeCodeField, { props: { label, name: 'code', value: '123' } });
  const el = input(container);
  expect(el.name).toBe('code');
  expect(el.value).toBe('123');
  expect(container.querySelectorAll('input[type="hidden"]').length).toBe(0);
});

it('枠の高さは中身の有無で変わらない(他の欄と同じ行高で固定する)', () => {
  // jsdom はレイアウトを計算しないので、出荷される CSS の宣言を検査する
  const css = readFileSync(join(import.meta.dirname, 'OneTimeCodeField.css'), 'utf-8');
  const block = css.slice(css.indexOf('.sc-otc-cell {'), css.indexOf('}', css.indexOf('.sc-otc-cell {')));
  expect(block).toContain('block-size: var(--sc-field-side)');
  expect(block).toContain('padding-block: 0');
});

// 届いた SMS のコードを待ち受ける(Web 方言。Chromium だけが持つ道)
describe('autoReceive', () => {
  const stubOtp = (code?: string) => {
    const get = vi.fn(
      (opts: any) =>
        new Promise((resolve, reject) => {
          if (code) resolve({ code });
          else opts.signal?.addEventListener('abort', () => reject(new Error('AbortError')));
        }),
    );
    Object.defineProperty(window, 'OTPCredential', { configurable: true, value: class {} });
    Object.defineProperty(navigator, 'credentials', { configurable: true, value: { get } });
    return get;
  };
  afterEach(() => {
    Object.defineProperty(window, 'OTPCredential', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'credentials', { configurable: true, value: undefined });
  });

  it('既定では待ち受けない(許可の確認を勝手に出さない)', () => {
    const get = stubOtp('123456');
    render(OneTimeCodeField, { props: { label } });
    expect(get).not.toHaveBeenCalled();
  });

  it('待ち受けて、届いたコードを値にし、揃えば知らせる', async () => {
    const get = stubOtp('123456');
    const onchange = vi.fn();
    const oncomplete = vi.fn();
    render(OneTimeCodeField, { props: { label, autoReceive: true, onchange, oncomplete } });
    expect(get).toHaveBeenCalledWith(expect.objectContaining({ otp: { transport: ['sms'] } }));
    await vi.waitFor(() => expect(onchange).toHaveBeenCalledWith('123456'));
    expect(oncomplete).toHaveBeenCalledWith('123456');
  });

  it('届いたコードにも打てる文字の規則が効く', async () => {
    stubOtp('12ab34');
    const onchange = vi.fn();
    render(OneTimeCodeField, { props: { label, autoReceive: true, onchange } });
    await vi.waitFor(() => expect(onchange).toHaveBeenCalledWith('1234'));
  });

  it('欄が居なくなったら待ち受けを中止する(許可の確認を残さない)', () => {
    const get = stubOtp();
    const { unmount } = render(OneTimeCodeField, { props: { label, autoReceive: true } });
    const signal = get.mock.calls[0][0].signal as AbortSignal;
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it('打てない欄では待ち受けない', () => {
    const get = stubOtp('123456');
    render(OneTimeCodeField, { props: { label, autoReceive: true, readonly: true } });
    expect(get).not.toHaveBeenCalled();
  });

  it('持たない環境では何も起きない(第7条)', () => {
    render(OneTimeCodeField, { props: { label, autoReceive: true } });
    // OTPCredential も navigator.credentials も無い状態。例外を投げずに描けていれば足りる
    expect(document.querySelectorAll('.sc-otc-input').length).toBeGreaterThan(0);
  });
});

it('打てる文字の絞り込みは純粋な計算として持つ', () => {
  expect(sanitize('12ab34', 'numeric', 6)).toBe('1234');
  expect(sanitize('12ab34', 'alphanumeric', 6)).toBe('12ab34');
  expect(sanitize('あ1-2', 'numeric', 6)).toBe('12');
  expect(sanitize('123456789', 'numeric', 4)).toBe('1234');
  // 大文字小文字は変えない(正規化はアプリ)
  expect(sanitize('AbC', 'alphanumeric', 6)).toBe('AbC');
});
