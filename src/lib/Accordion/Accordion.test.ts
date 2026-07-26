import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { vi } from 'vitest';
import Accordion from './Accordion.svelte';

const panel = createRawSnippet((id: () => string) => ({ render: () => `<p>${id()} の中身</p>` }));
const items = [
  { id: 'a', label: '配送について' },
  { id: 'b', label: '返品について' },
  { id: 'c', label: '法人向け(準備中)', disabled: true },
];
const summaries = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('summary')];
const details = (c: HTMLElement) => [...c.querySelectorAll<HTMLDetailsElement>('details')];

it('各項目は Disclosure の合成(開閉の機構を二度書かない)', () => {
  const { container } = render(Accordion, { props: { items, panel } });
  expect(container.querySelectorAll('.sc-disclosure').length).toBe(3);
  expect(summaries(container)[0]?.textContent).toContain('配送について');
});

it('既定はすべて畳んだ状態', () => {
  const { container } = render(Accordion, { props: { items, panel } });
  expect(details(container).every((d) => !d.open)).toBe(true);
});

it('open の集合にある項目が開く(複数同時に開いてよい)', () => {
  const { container } = render(Accordion, { props: { items, panel, open: ['a', 'b'] } });
  expect(details(container).map((d) => d.open)).toEqual([true, true, false]);
});

it('開閉の要求は新しい集合を渡す(値の更新はアプリ)', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Accordion, { props: { items, panel, open: ['a'], onopenchange } });
  await fireEvent.click(summaries(container)[1]!);
  expect(onopenchange).toHaveBeenCalledWith(['a', 'b']);
  // 2回目は1回目の結果(['a','b'])からの更新になる。値は部品の中でも動くので bind が効く
  await fireEvent.click(summaries(container)[0]!);
  expect(onopenchange).toHaveBeenLastCalledWith(['b']);
});

it('排他は値の側で表せる(部品は勝手に他を閉じない)', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Accordion, { props: { items, panel, open: ['a'], onopenchange } });
  await fireEvent.click(summaries(container)[1]!);
  // 部品は集合へ足すだけ。1つに保ちたいアプリは受け取った集合を絞る
  expect(onopenchange).toHaveBeenCalledWith(['a', 'b']);
});

it('開けない項目は要求を出さず、支援技術にもそう届く', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Accordion, { props: { items, panel, onopenchange } });
  const disabled = summaries(container)[2]!;
  expect(disabled.getAttribute('aria-disabled')).toBe('true');
  await fireEvent.click(disabled);
  expect(onopenchange).not.toHaveBeenCalled();
  expect(details(container)[2]!.open).toBe(false);
});

it('開けない項目も Tab 順に残る(存在ごと消さない)', () => {
  const { container } = render(Accordion, { props: { items, panel } });
  // native の <summary> は既定で焦点を受ける。tabindex="-1" で外していないことを見る
  expect(summaries(container)[2]!.getAttribute('tabindex')).toBeNull();
});
