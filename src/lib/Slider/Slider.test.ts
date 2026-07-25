import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Slider from './Slider.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const label = snip('<span>音量</span>');
const description = snip('<span>再生の音量を選ぶ説明</span>');

// 生成検査は props と tokensRequired しか照合しない(HOLES #19)。
// 契約が Normative に持つ要求(WCAG 2.5.7 の非ドラッグ操作・値の伝達・disabled)はここで守る。
describe('Slider', () => {
  it('name と範囲が支援技術へ届く(native の slider 意味論)', () => {
    render(Slider, { label, value: 40 });
    const slider = screen.getByRole('slider', { name: '音量' });
    expect(slider.getAttribute('aria-valuenow') ?? (slider as HTMLInputElement).value).toBe('40');
    expect((slider as HTMLInputElement).min).toBe('0');
    expect((slider as HTMLInputElement).max).toBe('100');
  });

  // 矢印 / Home / End の既定挙動は native が持ち(web-keys の arrows.slider は「native の
  // <input type=range> / APG Slider Pattern に一致」と書く)、jsdom はそこを実装しない。
  // ここでは配線(native の値変更が change / changeEnd へ写ること)を見る。キー操作そのものは
  // 実機の確認項目とする。
  it('値の変化が change(逐次)として出る', async () => {
    const onchange = vi.fn();
    const { container } = render(Slider, { label, value: 40, onchange });
    const input = container.querySelector('input') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: '41' } });
    expect(onchange).toHaveBeenCalledWith(41);
  });

  it('change は逐次、changeEnd は確定で分かれて出る', async () => {
    const onchange = vi.fn();
    const onchangeend = vi.fn();
    const { container } = render(Slider, { label, value: 40, onchange, onchangeend });
    const input = container.querySelector('input') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: '55' } });
    expect(onchange).toHaveBeenCalledWith(55);
    expect(onchangeend).not.toHaveBeenCalled();
    await fireEvent.change(input, { target: { value: '55' } });
    expect(onchangeend).toHaveBeenCalledWith(55);
  });

  it('step は native の属性として出る(丸めは native が持つ)', () => {
    const { container } = render(Slider, { label, value: 40, step: 10 });
    expect((container.querySelector('input') as HTMLInputElement).step).toBe('10');
  });

  it('disabled は native の抑制を使う(state.md §5)', () => {
    const { container } = render(Slider, { label, value: 40, disabled: true });
    expect((container.querySelector('input') as HTMLInputElement).disabled).toBe(true);
  });

  it('name はフォームに参加する(FormData に載る。契約 alpha.1)', () => {
    const { container } = render(Slider, { label, value: 40, name: 'volume' });
    const form = document.createElement('form');
    const input = container.querySelector('input') as HTMLInputElement;
    form.appendChild(input.cloneNode(true));
    expect(new FormData(form).get('volume')).toBe('40');
  });

  it('description は説明として結ばれる(field.md §2)', () => {
    render(Slider, { label, value: 40, description });
    const slider = screen.getByRole('slider');
    const id = slider.getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)?.textContent).toContain('説明');
  });
});
