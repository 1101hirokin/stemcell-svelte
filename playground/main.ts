// tokens は registry の pin(@stemcell/tokens)を読む。theme と density の CSS を束で当てる
import '@stemcell/tokens/standard.css';
import '@stemcell/tokens/density-compact.css';
import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });
