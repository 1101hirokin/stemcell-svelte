import { arrowKeys } from './direction';

// 行の向きの判定は :dir() に委ねる(算出値の direction を読まない)
it('行の向きが逆なら矢印の意味も逆になる', () => {
  const ltr = document.createElement('div');
  const rtl = document.createElement('div');
  rtl.matches = (s: string) => s === ':dir(rtl)';
  expect(arrowKeys(ltr)).toEqual({ forward: 'ArrowRight', backward: 'ArrowLeft' });
  expect(arrowKeys(rtl)).toEqual({ forward: 'ArrowLeft', backward: 'ArrowRight' });
});

it('相手が無ければ行の始まりから終わりへ(既定)', () => {
  expect(arrowKeys(undefined)).toEqual({ forward: 'ArrowRight', backward: 'ArrowLeft' });
});
