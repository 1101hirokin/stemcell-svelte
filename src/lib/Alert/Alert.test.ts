import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Alert from './Alert.svelte';

const body = createRawSnippet(() => ({ render: () => '<span>保存に失敗しました</span>' }));
const heading = createRawSnippet(() => ({ render: () => '<span>エラー</span>' }));

it('既定は info で role=status(穏当な告知)。本文を描く(Alert.md §3)', () => {
  const { container } = render(Alert, { props: { children: body } });
  const a = container.querySelector('.sc-alert') as HTMLElement;
  expect(a.dataset.color).toBe('info');
  expect(a.getAttribute('role')).toBe('status');
  expect(a.textContent).toContain('保存に失敗しました');
});

it('danger だけ即時の割り込み role=alert、他は role=status(§3。Stemcell 独自の規範)', () => {
  for (const [color, role] of [
    ['danger', 'alert'],
    ['warning', 'status'],
    ['success', 'status'],
    ['info', 'status'],
  ] as const) {
    const { container } = render(Alert, { props: { color, children: body } });
    expect((container.querySelector('.sc-alert') as HTMLElement).getAttribute('role')).toBe(role);
  }
});

it('先頭に intent の絵を出す(色に頼らない識別。WCAG 1.4.1)。絵は装飾(aria-hidden)', () => {
  const { container } = render(Alert, { props: { color: 'danger', children: body } });
  const icon = container.querySelector('.sc-alert-icon') as HTMLElement;
  expect(icon.getAttribute('aria-hidden')).toBe('true');
  expect(icon.querySelector('.sc-icon')).not.toBeNull();
});

it('title は slot(任意)。Alert 自身の名前にはしない(aria-labelledby を root に張らない。§3)', () => {
  const { container } = render(Alert, { props: { title: heading, children: body } });
  const a = container.querySelector('.sc-alert') as HTMLElement;
  expect(a.getAttribute('aria-labelledby')).toBeNull();
  expect((container.querySelector('.sc-alert-title') as HTMLElement).textContent).toContain('エラー');
});

it('既定は閉じられない(dismissible=false は × を出さない。§2)', () => {
  const { container } = render(Alert, { props: { children: body } });
  expect(container.querySelector('.sc-alert-dismiss')).toBeNull();
});

it('dismissible は × を出し、押すと ondismiss。× の名は 文脈(title)+ 閉じる語 を aria-labelledby で合成(§3)', () => {
  let dismissed = 0;
  const { container } = render(Alert, {
    props: { title: heading, dismissible: true, ondismiss: () => dismissed++, children: body },
  });
  const x = container.querySelector('.sc-alert-dismiss') as HTMLButtonElement;
  const ids = (x.getAttribute('aria-labelledby') ?? '').split(' ');
  expect(container.querySelector(`#${ids[0]}`)!.textContent).toContain('エラー'); // 先頭が文脈(title)
  expect((container.querySelector(`#${ids[1]}`) as HTMLElement).textContent).toBe('Close'); // 閉じる語(既定)
  // × と title は兄弟(入れ子でない)
  expect((container.querySelector('.sc-alert-title') as HTMLElement).contains(x)).toBe(false);
  x.click();
  expect(dismissed).toBe(1);
});

it('閉じる語の span は hidden(live region の読み上げを汚さない。aria-labelledby は hidden も参照する)', () => {
  const { container } = render(Alert, { props: { dismissible: true, children: body } });
  const ids = (container.querySelector('.sc-alert-dismiss')!.getAttribute('aria-labelledby') ?? '').split(' ');
  const span = container.querySelector(`#${ids[ids.length - 1]}`) as HTMLElement;
  expect(span.hasAttribute('hidden')).toBe(true);
});

it('title が無ければ × の名は閉じる語だけ。dismissLabel で上書きできる(第4条)', () => {
  const { container } = render(Alert, {
    props: { dismissible: true, dismissLabel: '閉じる', children: body },
  });
  const ids = (container.querySelector('.sc-alert-dismiss')!.getAttribute('aria-labelledby') ?? '').split(' ');
  expect(ids.length).toBe(1);
  expect((container.querySelector(`#${ids[0]}`) as HTMLElement).textContent).toBe('閉じる');
});
