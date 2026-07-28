<script lang="ts">
  // playground の殻。画面の並びはロードマップのクラスタ順(WORKFLOW §クラスタ表)で、
  // 1画面 = 1クラスタにしてある。節を足すときは screens/ の該当ファイルへ入れる
  // (この殻は触らない)。殻そのものも DS の部品で組んである(Sidebar / NavList / Select)。
  import { StemcellProvider, Toaster, Sidebar, Stack, Text, Divider, NavList, Select } from '../src/lib';
  import { SCREENS } from './screens/index';
  import Actions from './screens/actions.svelte';
  import Display from './screens/display.svelte';
  import Progress from './screens/progress.svelte';
  import Surfaces from './screens/surfaces.svelte';
  import Layout from './screens/layout.svelte';
  import Forms from './screens/forms.svelte';
  import Selection from './screens/selection.svelte';
  import Overlays from './screens/overlays.svelte';
  import Navigation from './screens/navigation.svelte';
  import Data from './screens/data.svelte';
  import Ai from './screens/ai.svelte';
  import Foundations from './screens/foundations.svelte';
  import Keyboard from './screens/keyboard.svelte';

  const VIEWS: Record<string, typeof Actions> = {
    actions: Actions,
    display: Display,
    progress: Progress,
    surfaces: Surfaces,
    layout: Layout,
    forms: Forms,
    selection: Selection,
    overlays: Overlays,
    navigation: Navigation,
    data: Data,
    ai: Ai,
    foundations: Foundations,
    keyboard: Keyboard,
  };

  const routeOf = () => {
    const id = location.hash.replace(/^#\//, '');
    return id in VIEWS ? id : SCREENS[0].id;
  };
  let route = $state(routeOf());
  $effect(() => {
    const onhash = () => (route = routeOf());
    window.addEventListener('hashchange', onhash);
    return () => window.removeEventListener('hashchange', onhash);
  });
  const screen = $derived(SCREENS.find((s) => s.id === route) ?? SCREENS[0]);
  const View = $derived(VIEWS[route] ?? Actions);

  let theme = $state<'auto' | 'standard-light' | 'standard-dark'>('auto');
  let density = $state<'comfortable' | 'compact'>('comfortable');
</script>

<StemcellProvider {theme} {density} />
<Toaster />

<div class="pg">
  <Sidebar sideWidth="16rem" gap="lg">
    {#snippet aside()}
      <Stack gap="lg">
        <header class="pg-header">
          <Text as="h1" variant="title-md">stemcell playground</Text>
          <Text as="p" variant="body-sm" muted>実装済み部品を実物で触って確認する器(WORKFLOW §2-6)。配信物ではない。</Text>
        </header>

        <NavList items={SCREENS.map((s) => ({ id: s.id, label: s.label, href: `#/${s.id}` }))} current={route}>
          {#snippet label()}画面{/snippet}
        </NavList>

        <Divider />

        <div class="pg-controls-stack">
          <Select
            value={theme}
            options={[
              { value: 'auto', label: 'OS に従う' },
              { value: 'standard-light', label: '明るい' },
              { value: 'standard-dark', label: '暗い' },
            ]}
            size="sm"
            onchange={(v) => (theme = v as typeof theme)}
          >
            {#snippet label()}テーマ{/snippet}
          </Select>
          <Select
            value={density}
            options={[
              { value: 'comfortable', label: 'comfortable' },
              { value: 'compact', label: 'compact' },
            ]}
            size="sm"
            onchange={(v) => (density = v as typeof density)}
          >
            {#snippet label()}密度{/snippet}
          </Select>
        </div>
      </Stack>
    {/snippet}

    <main class="pg-main">
      <header class="pg-header">
        <Text as="h2" variant="headline-sm">{screen.label}</Text>
        <Text as="p" variant="body-sm" muted>{screen.note}</Text>
      </header>
      <Divider />
      <View />
    </main>
  </Sidebar>
</div>
