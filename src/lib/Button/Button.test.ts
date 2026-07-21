import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Button from './Button.svelte';

const label = createRawSnippet(() => ({ render: () => '<span>save</span>' }));

it('ラベル必須のボタンとして描画され、既定は filled/primary/md', async () => {
  render(Button, { props: { children: label } });
  const b = screen.getByRole('button');
  expect(b.dataset.variant).toBe('filled');
  expect(b.dataset.color).toBe('primary');
  expect(b.dataset.size).toBe('md');
});

it('disabled のとき活性化(click)が発火しない(state.md §3.2)', async () => {
  let fired = 0;
  render(Button, { props: { children: label, disabled: true, onclick: () => fired++ } });
  const b = screen.getByRole('button') as HTMLButtonElement;
  b.click();
  expect(fired).toBe(0);
  expect(b.disabled).toBe(true);
});
