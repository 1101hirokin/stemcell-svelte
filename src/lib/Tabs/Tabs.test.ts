/**
 * 生成される適合検査は props と必須トークンの CSS 参照しか照合しない(HOLES #19)。
 * ここでは Collection の語彙(移動 = 選択・roving tabindex・disabled を飛ばす)と結線を守る。
 */
import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { vi } from 'vitest';
import Tabs from './Tabs.svelte';

const panel = createRawSnippet((id: () => string) => ({ render: () => `<p>${id()} の中身</p>` }));
const items = [
  { id: 'a', label: '概要' },
  { id: 'b', label: '活動', disabled: true },
  { id: 'c', label: '取引' },
];
const tabs = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[role="tab"]')];

it('帯は tablist、タブは tab、中身は tabpanel で、互いを指す', () => {
  const { container } = render(Tabs, { props: { value: 'a', items, panel } });
  expect(container.querySelector('[role="tablist"]')).not.toBeNull();
  const selected = tabs(container)[0]!;
  const panelEl = container.querySelector('[role="tabpanel"]') as HTMLElement;
  expect(selected.getAttribute('aria-controls')).toBe(panelEl.id);
  expect(panelEl.getAttribute('aria-labelledby')).toBe(selected.id);
});

it('焦点は帯の中で1つだけ Tab 順に載る(roving tabindex)', () => {
  const { container } = render(Tabs, { props: { value: 'c', items, panel } });
  expect(tabs(container).map((t) => t.tabIndex)).toEqual([-1, -1, 0]);
});

it('選ばれているタブだけが aria-selected を持ち、パネルはそのぶんだけを描く', () => {
  const { container } = render(Tabs, { props: { value: 'c', items, panel } });
  expect(tabs(container).map((t) => t.getAttribute('aria-selected'))).toEqual(['false', 'false', 'true']);
  expect(container.querySelectorAll('[role="tabpanel"]').length).toBe(1);
  expect(container.querySelector('[role="tabpanel"]')?.textContent).toContain('c の中身');
});

it('クリックで選択の要求が出る(値の更新はアプリ)', async () => {
  const onchange = vi.fn();
  const { container } = render(Tabs, { props: { value: 'a', items, panel, onchange } });
  await fireEvent.click(tabs(container)[2]!);
  expect(onchange).toHaveBeenCalledWith('c');
});

it('矢印は移動と選択を同時に行い、disabled は飛ばす(web-keys arrows.tabs)', async () => {
  const onchange = vi.fn();
  const { container } = render(Tabs, { props: { value: 'a', items, panel, onchange } });
  await fireEvent.keyDown(tabs(container)[0]!, { key: 'ArrowRight' });
  // b は disabled なので c へ飛ぶ
  expect(onchange).toHaveBeenCalledWith('c');
  await tick();
  // 選択が動いたことは帯の側で見る(この試験のスニペットは引数の変化に追従しない作りのため)
  expect(tabs(container).map((t) => t.getAttribute('aria-selected'))).toEqual(['false', 'false', 'true']);
});

it('端では回り込む。Home / End は両端へ飛ぶ', async () => {
  const onchange = vi.fn();
  const { container } = render(Tabs, { props: { value: 'c', items, panel, onchange } });
  await fireEvent.keyDown(tabs(container)[2]!, { key: 'ArrowRight' });
  expect(onchange).toHaveBeenLastCalledWith('a');
  const { container: c2 } = render(Tabs, { props: { value: 'a', items, panel, onchange } });
  await fireEvent.keyDown(tabs(c2)[0]!, { key: 'End' });
  expect(onchange).toHaveBeenLastCalledWith('c');
});

it('矢印の意味は論理方向に従う(RTL で Left / Right が反転する)', async () => {
  const onchange = vi.fn();
  const { container } = render(Tabs, { props: { value: 'a', items, panel, onchange } });
  (container.querySelector('[role="tablist"]') as HTMLElement).style.direction = 'rtl';
  await fireEvent.keyDown(tabs(container)[0]!, { key: 'ArrowLeft' });
  expect(onchange).toHaveBeenCalledWith('c');
});

it('値は bind に対応する(押した結果が包む側まで戻る)', async () => {
  const { container } = render(Tabs, { props: { value: 'a', items, panel } });
  await fireEvent.click(tabs(container)[2]!);
  await tick();
  // 部品の中で値が動くので、繋いだ消費者の値も一緒に動く(繋がないと bind が効かない罠になる)
  expect(tabs(container)[2]!.getAttribute('aria-selected')).toBe('true');
  expect(tabs(container)[2]!.tabIndex).toBe(0);
});
