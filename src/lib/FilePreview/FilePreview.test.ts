import { render, fireEvent } from '@testing-library/svelte';
import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import FilePreview from './FilePreview.svelte';

const base = { fileName: '請求書_2026_07.pdf', removeLabel: '添付を外す' };

it('名前と補足は文字で出る(絵だけに頼らない)', () => {
  const { container } = render(FilePreview, { props: { ...base, meta: '2.4 MB・PDF' } });
  expect(container.querySelector('.sc-filepreview-name')?.textContent).toBe('請求書_2026_07.pdf');
  expect(container.querySelector('.sc-filepreview-meta')?.textContent).toBe('2.4 MB・PDF');
});

it('外す操作は名前を持ち、押すと知らせる(列から外すのはアプリ)', async () => {
  const onremove = vi.fn();
  const { container } = render(FilePreview, { props: { ...base, onremove } });
  const btn = container.querySelector('.sc-filepreview-remove') as HTMLButtonElement;
  expect(btn.getAttribute('aria-label')).toBe('添付を外す');
  await fireEvent.click(btn);
  expect(onremove).toHaveBeenCalled();
});

it('下見の絵は装飾である(名前が隣にある)', () => {
  const { container } = render(FilePreview, { props: { ...base, thumbnail: 'blob:x' } });
  const media = container.querySelector('.sc-filepreview-media') as HTMLElement;
  expect(media.getAttribute('aria-hidden')).toBe('true');
  expect((media.querySelector('img') as HTMLImageElement).alt).toBe('');
});

it('切り詰めるのは見た目だけで、全文は支援技術へ届く', () => {
  const css = readFileSync(join(import.meta.dirname, 'FilePreview.css'), 'utf-8');
  const block = css.slice(css.indexOf('.sc-filepreview-name {'), css.indexOf('}', css.indexOf('.sc-filepreview-name {')));
  expect(block).toContain('text-overflow: ellipsis');
  // 文字を切り落とす形(内容そのものを削る)にしていないこと
  const { container } = render(FilePreview, { props: base });
  expect(container.querySelector('.sc-filepreview-name')?.textContent).toBe(base.fileName);
});
