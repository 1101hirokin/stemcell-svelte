// tokens は registry の pin(@stemcell/tokens)を読む。theme と density の CSS を束で当てる
import '@stemcell/tokens/standard.css';
import '@stemcell/tokens/density-compact.css';
// playground の飾り(部品ではない)。画面ごとのファイルから共通に引く
import './playground.css';
import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });
