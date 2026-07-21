// tokens は未 publish のため隣の作業コピーを読む(README)
import '../../stemcell-tokens/dist/web/standard.css';
import '../../stemcell-tokens/dist/web/density-compact.css';
import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });
