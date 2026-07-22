import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Popover from './Popover.svelte';

const anchor = createRawSnippet(() => ({ render: () => '<button>開く</button>' }));
const content = createRawSnippet(() => ({ render: () => '<div>中身</div>' }));

it('open=false では content を描かず、anchor は常に描く(Popover.md §1)', () => {
  const { container } = render(Popover, { props: { open: false, anchor, content } });
  expect(container.querySelector('.sc-popover')).toBeTruthy();
  expect(container.querySelector('button')).toBeTruthy();
  expect(container.querySelector('.sc-popover-content')).toBeNull();
});

it('open=true で content を描き、既定の開き方向は block-end', () => {
  const { container } = render(Popover, { props: { open: true, anchor, content } });
  const c = container.querySelector('.sc-popover-content') as HTMLElement;
  expect(c).toBeTruthy();
  expect(c.dataset.placement).toBe('block-end');
});

it('Escape で openchange(false) を発火する(light dismiss。overlay.md §3)', async () => {
  const onopenchange = vi.fn();
  render(Popover, { props: { open: true, anchor, content, onopenchange } });
  await fireEvent.keyDown(document, { key: 'Escape' });
  expect(onopenchange).toHaveBeenCalledWith(false);
});

it('外側の pointerdown で openchange(false) を発火する(light dismiss)', async () => {
  const onopenchange = vi.fn();
  const { container } = render(Popover, { props: { open: true, anchor, content, onopenchange } });
  const outside = document.createElement('div');
  document.body.appendChild(outside);
  await fireEvent.pointerDown(outside);
  expect(onopenchange).toHaveBeenCalledWith(false);
  outside.remove();
  // 内側の pointerdown は閉じない
  onopenchange.mockClear();
  await fireEvent.pointerDown(container.querySelector('.sc-popover-content')!);
  expect(onopenchange).not.toHaveBeenCalled();
});

it('placement=block-start を尊重する(反転は衝突時のみ。jsdom では反転しない)', () => {
  const { container } = render(Popover, { props: { open: true, placement: 'block-start', anchor, content } });
  expect((container.querySelector('.sc-popover-content') as HTMLElement).dataset.placement).toBe('block-start');
});
