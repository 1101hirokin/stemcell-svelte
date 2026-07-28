import { afterEach, expect, it, vi } from 'vitest';
import { keepAboveKeyboard } from './keyboard';

type Area = { top: number; height: number };
const listeners: Array<() => void> = [];

const stubViewport = (area: Area) => {
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: {
      offsetLeft: 0,
      offsetTop: area.top,
      width: 390,
      height: area.height,
      addEventListener: (_: string, fn: () => void) => listeners.push(fn),
      removeEventListener: () => {},
    },
  });
};

const fieldAt = (top: number, height = 45) =>
  ({ getBoundingClientRect: () => ({ top, bottom: top + height, left: 0, right: 390, width: 390, height }) }) as HTMLElement;

afterEach(() => {
  listeners.length = 0;
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const run = (el: HTMLElement) => {
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => (fn(), 1));
  const scrollBy = vi.fn();
  vi.stubGlobal('scrollBy', scrollBy);
  const stop = keepAboveKeyboard(el);
  return { scrollBy, stop };
};

it('鍵盤に隠れている欄は、はみ出した分だけ送る', () => {
  stubViewport({ top: 0, height: 400 }); // 鍵盤が出て、見えるのは上から 400px まで
  const { scrollBy } = run(fieldAt(380)); // 欄の下端は 425
  expect(scrollBy).toHaveBeenCalledWith({ top: 425 - (400 - 8) });
});

it('見えているところに居る欄は動かさない(環境が運んだ後は何もしない)', () => {
  stubViewport({ top: 0, height: 400 });
  const { scrollBy } = run(fieldAt(200));
  expect(scrollBy).not.toHaveBeenCalled();
});

it('見えている領域が下へずれているとき(拡大)は、その上端へ寄せる', () => {
  stubViewport({ top: 300, height: 300 });
  const { scrollBy } = run(fieldAt(100)); // 欄は見えている領域より上
  expect(scrollBy).toHaveBeenCalledWith({ top: -(300 + 8 - 100) });
});

it('鍵盤が出入りするたびに測り直す', () => {
  stubViewport({ top: 0, height: 800 });
  const el = fieldAt(700);
  const { scrollBy } = run(el);
  expect(scrollBy).not.toHaveBeenCalled();
  stubViewport({ top: 0, height: 400 }); // 鍵盤が出た
  listeners.forEach((fn) => fn());
  expect(scrollBy).toHaveBeenCalledWith({ top: 745 - (400 - 8) });
});
