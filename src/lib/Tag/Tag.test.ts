import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Tag from './Tag.svelte';

const label = createRawSnippet(() => ({ render: () => '<span>カテゴリ</span>' }));

it('静的な札(selected も dismissible も無い)は span で、role も操作も持たない(§3)', () => {
  const { container } = render(Tag, { props: { children: label } });
  const t = container.querySelector('.sc-tag') as HTMLElement;
  expect(t.tagName).toBe('SPAN');
  expect(t.getAttribute('role')).toBeNull();
  expect(container.querySelector('button')).toBeNull();
  expect(t.textContent).toContain('カテゴリ');
});

it('選べる札(selected 指定)は button で aria-pressed を持ち、押すと onclick が発火(§2)', () => {
  let fired = 0;
  const { container } = render(Tag, { props: { children: label, selected: false, onclick: () => fired++ } });
  const btn = container.querySelector('button.sc-tag') as HTMLButtonElement;
  expect(btn).not.toBeNull();
  expect(btn.getAttribute('aria-pressed')).toBe('false');
  btn.click();
  expect(fired).toBe(1);
});

it('selected=true は aria-pressed=true で、先頭に check(装飾。意味は aria-pressed が運ぶ)', () => {
  const { container } = render(Tag, { props: { children: label, selected: true } });
  const btn = container.querySelector('button.sc-tag') as HTMLButtonElement;
  expect(btn.getAttribute('aria-pressed')).toBe('true');
  const icon = btn.querySelector('.sc-icon') as SVGElement;
  expect(icon).not.toBeNull();
  expect(icon.getAttribute('aria-hidden')).toBe('true');
});

it('消せる札(dismissible)は器の中に静的ラベルと × を兄弟に持ち、× で ondismiss が発火(§2)', () => {
  let dismissed = 0;
  const { container } = render(Tag, { props: { children: label, dismissible: true, ondismiss: () => dismissed++ } });
  const root = container.querySelector('.sc-tag') as HTMLElement;
  const body = root.querySelector('.sc-tag-body') as HTMLElement;
  const x = root.querySelector('.sc-tag-dismiss') as HTMLButtonElement;
  // 本体は静的(button でない)、× は兄弟(× は本体の子孫でない = 入れ子でない)
  expect(body.tagName).toBe('SPAN');
  expect(body.contains(x)).toBe(false);
  x.click();
  expect(dismissed).toBe(1);
});

it('× のアクセシブルネームは本体ラベル + 削除語を aria-labelledby で合成する(§3)', () => {
  const { container } = render(Tag, { props: { children: label, dismissible: true } });
  const x = container.querySelector('.sc-tag-dismiss') as HTMLElement;
  const body = container.querySelector('.sc-tag-body') as HTMLElement;
  const ids = (x.getAttribute('aria-labelledby') ?? '').split(' ');
  expect(ids[0]).toBe(body.id); // 先頭が本体ラベル
  const suffix = container.querySelector(`#${ids[1]}`) as HTMLElement;
  expect(suffix.textContent).toBe('Remove'); // 既定の削除語(Web 層。上書き可)
});

it('選択 + 消す が同居しても入れ子にしない: 本体は選択ボタン、× は兄弟(それぞれ別の操作)', () => {
  let clicked = 0;
  let dismissed = 0;
  const { container } = render(Tag, {
    props: { children: label, selected: true, dismissible: true, onclick: () => clicked++, ondismiss: () => dismissed++ },
  });
  const body = container.querySelector('.sc-tag-body') as HTMLButtonElement;
  const x = container.querySelector('.sc-tag-dismiss') as HTMLButtonElement;
  expect(body.tagName).toBe('BUTTON');
  expect(body.getAttribute('aria-pressed')).toBe('true');
  expect(body.contains(x)).toBe(false); // 兄弟(入れ子でない)
  body.click();
  x.click();
  expect(clicked).toBe(1);
  expect(dismissed).toBe(1);
});

it('disabled は相互作用を止める(選べる札の click が発火しない。native disabled)', () => {
  let fired = 0;
  const { container } = render(Tag, { props: { children: label, selected: false, disabled: true, onclick: () => fired++ } });
  const btn = container.querySelector('button.sc-tag') as HTMLButtonElement;
  expect(btn.disabled).toBe(true);
  btn.click();
  expect(fired).toBe(0);
});

it('disabled は器へ data-disabled を立てる(CSS は token を disabled 系へ差し替え。減衰でない。state.md §7)', () => {
  const sel = render(Tag, { props: { children: label, selected: false, disabled: true } });
  expect((sel.container.querySelector('.sc-tag') as HTMLElement).dataset.disabled).toBe('true');
  const dis = render(Tag, { props: { children: label, dismissible: true, disabled: true } });
  expect((dis.container.querySelector('.sc-tag') as HTMLElement).dataset.disabled).toBe('true');
});

it('dismissLabel でロケールを上書きできる(Web 層の逃げ道。第4条)', () => {
  const { container } = render(Tag, { props: { children: label, dismissible: true, dismissLabel: '削除' } });
  const ids = (container.querySelector('.sc-tag-dismiss')!.getAttribute('aria-labelledby') ?? '').split(' ');
  expect((container.querySelector(`#${ids[1]}`) as HTMLElement).textContent).toBe('削除');
});

it('variant / size を data 属性で持つ', () => {
  const { container } = render(Tag, { props: { children: label, variant: 'outlined', size: 'sm' } });
  const t = container.querySelector('.sc-tag') as HTMLElement;
  expect(t.dataset.variant).toBe('outlined');
  expect(t.dataset.size).toBe('sm');
});
