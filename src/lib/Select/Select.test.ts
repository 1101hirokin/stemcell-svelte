import { render, screen, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Select from './Select.svelte';

const label = createRawSnippet(() => ({ render: () => '<span>配送サイズ</span>' }));
const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const opts = [
  { value: 's', label: '小' },
  { value: 'm', label: '中' },
  { value: 'l', label: '大', disabled: true },
];

it('native select(role=combobox)として描画され、既定は md・未選択("")', () => {
  render(Select, { props: { options: opts, label } });
  const el = screen.getByRole('combobox') as HTMLSelectElement;
  expect(el.tagName).toBe('SELECT');
  expect((el.closest('.sc-select') as HTMLElement).dataset.size).toBe('md');
});

it('options はデータで描画され、disabled 選択肢は選べない', () => {
  const { container } = render(Select, { props: { options: opts, label } });
  const options = [...container.querySelectorAll('option')] as HTMLOptionElement[];
  expect(options.map((o) => o.value)).toEqual(['s', 'm', 'l']);
  expect(options.find((o) => o.value === 'l')!.disabled).toBe(true);
});

it('placeholder は無効化された先頭 option として出る(選ばれ得ない。field.md §2)', () => {
  const { container } = render(Select, { props: { options: opts, placeholder: '選択してください', label } });
  const first = container.querySelector('option') as HTMLOptionElement;
  expect(first.value).toBe('');
  expect(first.disabled).toBe(true);
  expect(first.textContent).toBe('選択してください');
});

it('change: 選択で payload は新しい value(field.md §5。離散)', async () => {
  const onchange = vi.fn();
  render(Select, { props: { options: opts, label, onchange } });
  const el = screen.getByRole('combobox') as HTMLSelectElement;
  await fireEvent.change(el, { target: { value: 'm' } });
  expect(onchange).toHaveBeenCalledWith('m');
});

it('値の所有: value でアプリが選択を制御する(field.md §5)', () => {
  render(Select, { props: { options: opts, label, value: 'm' } });
  expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('m');
});

it('label は for/id で配線される(無名は許さない。field.md §2)', () => {
  const { container } = render(Select, { props: { options: opts, label } });
  const el = screen.getByRole('combobox');
  const lab = container.querySelector('.sc-select-label') as HTMLLabelElement;
  expect(lab.getAttribute('for')).toBe(el.id);
});

it('invalid/required/disabled は TextField と同じ配線(aria-invalid / required / disabled)', () => {
  render(Select, { props: { options: opts, label, invalid: true, required: true } });
  const el = screen.getByRole('combobox') as HTMLSelectElement;
  expect(el.getAttribute('aria-invalid')).toBe('true');
  expect(el.required).toBe(true);
});

it('required の視覚標示は label に出る(部品が自動で出す。field.md §4)', () => {
  const { container } = render(Select, { props: { options: opts, label, required: true } });
  const marker = container.querySelector('.sc-select-required') as HTMLElement;
  expect(marker.getAttribute('aria-hidden')).toBe('true');
});

it('description と error は aria-describedby で届く(invalid のとき error も。field.md §3)', () => {
  const { container } = render(Select, {
    props: {
      options: opts,
      label,
      invalid: true,
      description: snip('<span>ひとつ選ぶ</span>'),
      error: snip('<span>未選択</span>'),
    },
  });
  const el = screen.getByRole('combobox');
  const ids = (el.getAttribute('aria-describedby') ?? '').split(' ');
  expect(ids).toContain(container.querySelector('.sc-select-description')!.id);
  expect(ids).toContain(container.querySelector('.sc-select-error')!.id);
});

it('開閉(open)を prop に持たない(native select の開閉はブラウザ所有。Select.md §2)', () => {
  const { component } = render(Select, { props: { options: opts, label } }) as any;
  // 契約に open は無い。実装も open/onopen を受けない(存在しないことの明示)
  expect('open' in (component ?? {})).toBe(false);
});
