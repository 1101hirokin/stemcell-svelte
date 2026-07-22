import { render, screen, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import Select from './Select.svelte';

const label = createRawSnippet(() => ({ render: () => '<span>配送サイズ</span>' }));
const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));
const opts = [
  { value: 's', label: '小', icon: 'search' },
  { value: 'm', label: '中', description: '10kg まで' },
  { value: 'l', label: '大', disabled: true },
];

function mockPointer(coarse: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: q.includes('coarse') ? coarse : false,
    media: q,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  })) as unknown as typeof window.matchMedia;
}

// ---- custom(pointer)経路: 既定 ----
describe('pointer 経路(custom combobox+listbox)', () => {
  beforeEach(() => mockPointer(false));

  it('role=combobox のトリガーを描き、既定は閉じている(aria-expanded=false)', () => {
    render(Select, { props: { options: opts, label } });
    const t = screen.getByRole('combobox');
    expect(t.getAttribute('aria-haspopup')).toBe('listbox');
    expect(t.getAttribute('aria-expanded')).toBe('false');
  });

  it('クリックで開き、role=listbox と role=option(データ描画)が現れる', async () => {
    render(Select, { props: { options: opts, label } });
    await fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeTruthy();
    const options = screen.getAllByRole('option');
    expect(options.map((o) => o.textContent?.replace(/\s+/g, ''))).toEqual(['小', '中10kgまで', '大']);
  });

  it('リッチ選択肢: icon と description を描く(RFC 0007 の A)', async () => {
    const { container } = render(Select, { props: { options: opts, label } });
    await fireEvent.click(screen.getByRole('combobox'));
    expect(container.querySelector('.sc-select-option-icon')).toBeTruthy();
    expect(container.querySelector('.sc-select-option-desc')?.textContent).toContain('10kg');
  });

  it('矢印で aria-activedescendant が動く(DOM focus はトリガー据置。overlay.md §4 の仮想 focus)', async () => {
    const { container } = render(Select, { props: { options: opts, label } });
    const t = screen.getByRole('combobox');
    await fireEvent.keyDown(t, { key: 'ArrowDown' }); // 開く + 先頭 active
    const uid = t.id.replace('-input', '');
    expect(t.getAttribute('aria-activedescendant')).toBe(`${uid}-opt-0`);
    await fireEvent.keyDown(t, { key: 'ArrowDown' }); // 中へ
    expect(t.getAttribute('aria-activedescendant')).toBe(`${uid}-opt-1`);
    // disabled(大)は飛ばす: End は最後の enabled=中(index1)
    await fireEvent.keyDown(t, { key: 'End' });
    expect(t.getAttribute('aria-activedescendant')).toBe(`${uid}-opt-1`);
    expect(container.querySelector('.sc-select-option[data-disabled="true"]')?.getAttribute('id')).toBe(`${uid}-opt-2`);
  });

  it('Enter で active を選択して閉じ、change は新しい value(field.md §5)', async () => {
    const onchange = vi.fn();
    render(Select, { props: { options: opts, label, onchange } });
    const t = screen.getByRole('combobox');
    await fireEvent.keyDown(t, { key: 'ArrowDown' }); // open, active=0(小)
    await fireEvent.keyDown(t, { key: 'ArrowDown' }); // active=1(中)
    await fireEvent.keyDown(t, { key: 'Enter' });
    expect(onchange).toHaveBeenCalledWith('m');
    expect(t.getAttribute('aria-expanded')).toBe('false');
  });

  it('option の pointerdown で選択し、selected は aria-selected と check で示す', async () => {
    const onchange = vi.fn();
    const { container } = render(Select, { props: { options: opts, label, value: 's', onchange } });
    await fireEvent.click(screen.getByRole('combobox'));
    const selected = container.querySelector('.sc-select-option[aria-selected="true"]');
    expect(selected?.textContent).toContain('小');
    expect(selected?.querySelector('.sc-select-option-check')).toBeTruthy();
    // 中を選ぶ
    await fireEvent.pointerDown(screen.getAllByRole('option')[1]!);
    expect(onchange).toHaveBeenCalledWith('m');
  });

  it('disabled option は選べない(pointerdown で change しない)', async () => {
    const onchange = vi.fn();
    render(Select, { props: { options: opts, label, onchange } });
    await fireEvent.click(screen.getByRole('combobox'));
    await fireEvent.pointerDown(screen.getAllByRole('option')[2]!); // 大(disabled)
    expect(onchange).not.toHaveBeenCalled();
  });

  it('Escape で閉じる(選択は変えない)', async () => {
    render(Select, { props: { options: opts, label } });
    const t = screen.getByRole('combobox');
    await fireEvent.keyDown(t, { key: 'ArrowDown' });
    expect(t.getAttribute('aria-expanded')).toBe('true');
    await fireEvent.keyDown(t, { key: 'Escape' });
    expect(t.getAttribute('aria-expanded')).toBe('false');
  });

  it('field 配線: label は for/id、aria-invalid / required / describedby(TextField と同じ)', () => {
    const { container } = render(Select, {
      props: { options: opts, label, invalid: true, required: true, description: snip('<span>ひとつ</span>') },
    });
    const t = screen.getByRole('combobox');
    const lab = container.querySelector('.sc-select-label') as HTMLLabelElement;
    expect(lab.getAttribute('for')).toBe(t.id);
    expect(t.getAttribute('aria-invalid')).toBe('true');
    expect(t.getAttribute('aria-required')).toBe('true');
    expect((t.getAttribute('aria-describedby') ?? '').includes(container.querySelector('.sc-select-description')!.id)).toBe(true);
  });
});

// ---- touch(native)経路 ----
describe('touch 経路(native select)', () => {
  beforeEach(() => mockPointer(true));

  it('native <select> を描き、options と placeholder(無効化先頭 option)を持つ', () => {
    const { container } = render(Select, { props: { options: opts, label, placeholder: '選択' } });
    const el = container.querySelector('select') as HTMLSelectElement;
    expect(el).toBeTruthy();
    const options = [...el.querySelectorAll('option')] as HTMLOptionElement[];
    expect(options[0]!.value).toBe('');
    expect(options[0]!.disabled).toBe(true);
    expect(options.slice(1).map((o) => o.value)).toEqual(['s', 'm', 'l']);
  });

  it('native change は payload=新しい value', async () => {
    const onchange = vi.fn();
    const { container } = render(Select, { props: { options: opts, label, onchange } });
    const el = container.querySelector('select') as HTMLSelectElement;
    await fireEvent.change(el, { target: { value: 'm' } });
    expect(onchange).toHaveBeenCalledWith('m');
  });
});
