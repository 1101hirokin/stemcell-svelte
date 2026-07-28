import { afterEach, describe, expect, it, vi } from 'vitest';
import { availableBlockSize, inlineShift, resolveSides, visibleArea } from './overlay-position';

// 見えている領域を差し替える(触点で鍵盤が出ると、版面はそのままで見える高さだけが減る)
const withKeyboard = (visible: { left?: number; top?: number; width: number; height: number }) => {
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: { offsetLeft: visible.left ?? 0, offsetTop: visible.top ?? 0, width: visible.width, height: visible.height, addEventListener() {}, removeEventListener() {} },
  });
};

afterEach(() => {
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });
  vi.unstubAllGlobals();
});

describe('見えている領域', () => {
  it('visualViewport が無い環境では版面をそのまま使う', () => {
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);
    expect(visibleArea()).toEqual({ left: 0, top: 0, width: 1024, height: 768 });
  });

  it('鍵盤が出ているときは、版面ではなく見えている高さを使う', () => {
    vi.stubGlobal('innerHeight', 800);
    withKeyboard({ width: 390, height: 400 });
    expect(visibleArea().height).toBe(400);
  });
});

describe('開く向き', () => {
  it('版面では下に空きがあっても、鍵盤に隠れる側へは開かない', () => {
    vi.stubGlobal('innerWidth', 390);
    vi.stubGlobal('innerHeight', 800);
    const anchor = { top: 300, left: 24, width: 300, height: 45 };
    // 鍵盤が無ければ、欄は版面の上半分にいるので下へ開く
    expect(resolveSides(anchor, 300, 'center').block).toBe('end');
    // 鍵盤が出ると、同じ欄が見えている領域の下半分に来るので上へ開く
    withKeyboard({ width: 390, height: 400 });
    expect(resolveSides(anchor, 300, 'center').block).toBe('start');
  });
});

describe('残っている縦の空き', () => {
  it('下へ開くときは、鍵盤の上までしか空いていない', () => {
    vi.stubGlobal('innerHeight', 800);
    const anchor = { top: 100, height: 45 };
    expect(availableBlockSize(anchor, 'end', 4)).toBe(800 - 145 - 4 - 8);
    withKeyboard({ width: 390, height: 400 });
    expect(availableBlockSize(anchor, 'end', 4)).toBe(400 - 145 - 4 - 8);
  });

  it('拡大して領域がずれているときは、そのずれを差し引く', () => {
    vi.stubGlobal('innerHeight', 800);
    withKeyboard({ top: 200, width: 390, height: 400 });
    // 上へ開くなら、空きは欄の上端から見えている領域の上端まで
    expect(availableBlockSize({ top: 500, height: 45 }, 'start', 4)).toBe(500 - 200 - 4 - 8);
  });
});

describe('横の押し戻し', () => {
  it('見えている領域の端で押し戻す', () => {
    vi.stubGlobal('innerWidth', 390);
    expect(inlineShift(-20, 300)).toBe(28); // 端から 8px 内側へ
    withKeyboard({ left: 100, width: 200, height: 400 });
    expect(inlineShift(120, 200)).toBe(-28); // 右端(300)から 8px 内側(292)まで戻す
  });
});
