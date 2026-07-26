import { vi } from 'vitest';
import { watchCompact } from './viewport';

// 閾値はトークンの算出値から取る(実装に px を直書きしない。RFC 0017 / layout.md §8)
const stub = (breakpoint: string, matches: boolean) => {
  const listeners = new Set<() => void>();
  const query = {
    matches,
    media: '',
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  const seen: string[] = [];
  vi.stubGlobal('matchMedia', (q: string) => {
    seen.push(q);
    return query as unknown as MediaQueryList;
  });
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: (name: string) => (name === '--breakpoint-medium' ? breakpoint : ''),
  } as unknown as CSSStyleDeclaration);
  return { seen, fire: (next: boolean) => ((query.matches = next), listeners.forEach((fn) => fn())) };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('トークンの閾値から手前までを狭いとみなす', () => {
  const { seen } = stub('600px', true);
  const got: boolean[] = [];
  watchCompact((v) => got.push(v));
  expect(seen[0]).toBe('(max-width: 599.98px)'); // medium は広い側なので、狭いのはその手前まで
  expect(got).toEqual([true]);
});

it('画面の広さが変わったら知らせる', () => {
  const { fire } = stub('600px', false);
  const got: boolean[] = [];
  const stop = watchCompact((v) => got.push(v));
  fire(true);
  stop();
  fire(false); // 止めたあとは届かない
  expect(got).toEqual([false, true]);
});

it('トークンが届いていない環境では広い側に倒す', () => {
  stub('', false);
  const got: boolean[] = [];
  watchCompact((v) => got.push(v));
  expect(got).toEqual([]); // 何も報告しない = popover のまま
});
