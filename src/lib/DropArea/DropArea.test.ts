import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { expect, it, vi } from 'vitest';
import DropArea from './DropArea.svelte';

const children = createRawSnippet(() => ({ render: () => '<span>ここへ落とす</span>' }));
const file = (name: string, type: string) => new File(['x'], name, { type });
const area = (c: HTMLElement) => c.querySelector('.sc-droparea') as HTMLElement;
const transfer = (files: File[]) => ({ files, dropEffect: '' }) as unknown as DataTransfer;

it('面は焦点を受けず、まとまりとして名前を持つ', () => {
  const { container } = render(DropArea, { props: { children, label: '添付を落とす' } });
  const el = area(container);
  expect(el.getAttribute('role')).toBe('group');
  expect(el.getAttribute('aria-label')).toBe('添付を落とす');
  expect(el.getAttribute('tabindex')).toBe(null);
});

it('落ちてくる最中は状態で表す(hover とは別。RFC 0022)', async () => {
  const { container } = render(DropArea, { props: { children } });
  const el = area(container);
  expect(el.dataset.dragover).toBe('false');
  await fireEvent.dragEnter(el, { dataTransfer: transfer([]) });
  expect(el.dataset.dragover).toBe('true');
  await fireEvent.dragLeave(el);
  expect(el.dataset.dragover).toBe('false');
});

it('子の上を通っても、面から出るまでは状態が消えない', async () => {
  const { container } = render(DropArea, { props: { children } });
  const el = area(container);
  await fireEvent.dragEnter(el, { dataTransfer: transfer([]) });
  await fireEvent.dragEnter(el.firstElementChild!, { dataTransfer: transfer([]) }); // 子へ入る
  await fireEvent.dragLeave(el); // 親から出た扱いの一発目
  expect(el.dataset.dragover).toBe('true');
  await fireEvent.dragLeave(el);
  expect(el.dataset.dragover).toBe('false');
});

it('落ちたものを知らせる。値は持たない', async () => {
  const ondrop = vi.fn();
  const { container } = render(DropArea, { props: { children, ondrop } });
  await fireEvent.drop(area(container), { dataTransfer: transfer([file('a.png', 'image/png')]) });
  expect(ondrop).toHaveBeenCalledWith([expect.objectContaining({ name: 'a.png' })]);
});

it('accept に合わないものは弾いて知らせる', async () => {
  const ondrop = vi.fn();
  const onreject = vi.fn();
  const { container } = render(DropArea, { props: { children, accept: ['image/*'], ondrop, onreject } });
  await fireEvent.drop(area(container), {
    dataTransfer: transfer([file('a.png', 'image/png'), file('b.pdf', 'application/pdf')]),
  });
  expect(ondrop).toHaveBeenCalledWith([expect.objectContaining({ name: 'a.png' })]);
  expect(onreject).toHaveBeenCalledWith([expect.objectContaining({ name: 'b.pdf' })]);
});

it('落とせない面は受け取らない', async () => {
  const ondrop = vi.fn();
  const { container } = render(DropArea, { props: { children, disabled: true, ondrop } });
  const el = area(container);
  await fireEvent.dragEnter(el, { dataTransfer: transfer([]) });
  expect(el.dataset.dragover).toBe('false');
  await fireEvent.drop(el, { dataTransfer: transfer([file('a.png', 'image/png')]) });
  expect(ondrop).not.toHaveBeenCalled();
});
