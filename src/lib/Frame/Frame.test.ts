import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Frame from './Frame.svelte';
import { isRatio } from './meta';

const kids = createRawSnippet(() => ({ render: () => '<img alt="" src="x.png" />' }));
const el = (c: HTMLElement) => c.querySelector('.sc-frame') as HTMLElement;
const ratioOf = (c: HTMLElement) => el(c).style.getPropertyValue('--sc-frame-ratio');

it('既定は 16/9', () => {
  const { container } = render(Frame, { props: { children: kids } });
  expect(ratioOf(container)).toBe('16/9');
});

it('比は枠へそのまま渡る', () => {
  for (const ok of ['1/1', '4/3', '21 / 9']) {
    const { container } = render(Frame, { props: { children: kids, ratio: ok } });
    expect(ratioOf(container), ok).toBe(ok);
  }
});

it('比でない値は warn して既定へ退避する(aspect-ratio の無警告消滅を防ぐ)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const bad of ['banana', '16', '16:9', '1/0', '-16/9', '']) {
    const { container } = render(Frame, { props: { children: kids, ratio: bad } });
    expect(ratioOf(container), `ratio="${bad}"`).toBe('16/9');
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes(`ratio="${bad}"`)),
      `warn for ratio="${bad}"`,
    ).toBe(true);
  }
  warn.mockRestore();
});

it('isRatio: 「横/縦」の正の整数比だけを許す', () => {
  for (const ok of ['16/9', '1/1', ' 4 / 3 ']) expect(isRatio(ok), ok).toBe(true);
  for (const bad of ['16:9', '1.5/1', '0/1', '1/0', '16', '', '/', 'a/b'])
    expect(isRatio(bad), bad).toBe(false);
});
