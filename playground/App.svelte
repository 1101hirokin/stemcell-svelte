<script lang="ts">
  import { StemcellProvider, Button, Switcher, Box, Stack, Cluster, TextField, Grid, Sidebar } from '../src/lib';

  let theme = $state<'auto' | 'standard-light' | 'standard-dark'>('auto');
  let density = $state<'comfortable' | 'compact'>('comfortable');
  let threshold = $state('30rem');
  let invite = $state('abc');
  let gridMin = $state('16rem');
  let sidebarSide = $state<'start' | 'end'>('start');

  const variants = ['filled', 'soft', 'outlined', 'text'] as const;
  const colors = ['primary', 'danger', 'warning', 'plain'] as const;
</script>

<StemcellProvider {theme} {density} />

<main class="pg">
  <header class="pg-header">
    <h1>stemcell svelte playground</h1>
    <p>
      実装済み部品を実物で触って確認する器(WORKFLOW §2-6)。配信物ではない。
    </p>
    <div class="pg-controls">
      <label>
        theme
        <select bind:value={theme}>
          <option value="auto">auto(OS 追従)</option>
          <option value="standard-light">standard-light</option>
          <option value="standard-dark">standard-dark</option>
        </select>
      </label>
      <label>
        density
        <select bind:value={density}>
          <option value="comfortable">comfortable</option>
          <option value="compact">compact</option>
        </select>
      </label>
    </div>
  </header>

  <section>
    <h2>Button</h2>
    <p>variant × color の全組。下段は size と disabled / block。</p>
    {#each variants as variant (variant)}
      <div class="pg-row">
        <code class="pg-tag">{variant}</code>
        <Cluster gap="sm">
          {#each colors as color (color)}
            <Button {variant} {color}>{color}</Button>
          {/each}
        </Cluster>
      </div>
    {/each}
    <div class="pg-row">
      <code class="pg-tag">size ほか</code>
      <Cluster gap="sm" align="center">
        <Button size="sm">sm</Button>
        <Button size="md">md</Button>
        <Button size="lg">lg</Button>
        <Button disabled>disabled</Button>
      </Cluster>
    </div>
    <div class="pg-row">
      <code class="pg-tag">block</code>
      <Button block>block(横いっぱいに広がろうとする既定の実演)</Button>
    </div>
  </section>

  <section>
    <h2>Switcher</h2>
    <p>
      右下の掴みで器の幅をドラッグして切替を確認する。器の幅が threshold
      ({threshold})未満で縦へ一斉に切り替わる(閾値駆動。rem 裁定済み)。
    </p>
    <label class="pg-field">
      threshold
      <input bind:value={threshold} />
    </label>
    <div class="pg-resizable">
      <Switcher {threshold}>
        <Button>変更を保存</Button>
        <Button variant="outlined" color="plain">キャンセル</Button>
        <Button variant="soft">プレビュー</Button>
      </Switcher>
    </div>
  </section>

  <section>
    <h2>TextField</h2>
    <p>
      複合フィールド(label / description / error 内包)。エラー文は danger.soft-fg の転用
      (実測 10.45:1 / 11.04:1)。invalid は8文字未満で立つ(逐次 change のデモ)。
    </p>
    <Stack gap="lg">
      <TextField bind:value={invite} invalid={invite.length < 8} keyboard="text">
        {#snippet label()}招待コード{/snippet}
        {#snippet description()}8文字以上{/snippet}
        {#snippet error()}短すぎる({invite.length}文字)。8文字以上にすること{/snippet}
      </TextField>
      <TextField required autocomplete="name" placeholder="例: 山田太郎">
        {#snippet label()}氏名(required + placeholder){/snippet}
      </TextField>
      <TextField keyboard="email" autocomplete="email">
        {#snippet label()}メール(keyboard=email){/snippet}
        {#snippet start()}@{/snippet}
        {#snippet end()}<Button variant="text" size="sm">消去</Button>{/snippet}
      </TextField>
      <Cluster gap="md">
        <TextField size="sm">
          {#snippet label()}sm{/snippet}
        </TextField>
        <TextField size="md">
          {#snippet label()}md{/snippet}
        </TextField>
        <TextField size="lg">
          {#snippet label()}lg{/snippet}
        </TextField>
      </Cluster>
      <Cluster gap="md">
        <TextField disabled value="編集不可">
          {#snippet label()}disabled{/snippet}
        </TextField>
        <TextField readonly value="読める">
          {#snippet label()}readonly{/snippet}
        </TextField>
        <TextField disabled invalid value="無効が勝つ">
          {#snippet label()}disabled × invalid{/snippet}
          {#snippet error()}枠は disabled の色になる(state.md §3.1){/snippet}
        </TextField>
      </Cluster>
    </Stack>
  </section>

  <section>
    <h2>Box</h2>
    <p>内在スタイルの器。inset は段(sm/md/lg)と大域の原始 X(8〜24)。</p>
    <Cluster gap="sm">
      {#each ['sm', 'md', 'lg', '12'] as inset (inset)}
        <div class="pg-outline">
          <Box {inset}><code>inset="{inset}"</code></Box>
        </div>
      {/each}
    </Cluster>
  </section>

  <section>
    <h2>Stack</h2>
    <p>間隔を所有する縦/横の並び(中身は外側 margin を持たない)。</p>
    <div class="pg-row">
      <code class="pg-tag">stack / gap=sm</code>
      <div class="pg-outline">
        <Stack gap="sm">
          <div class="pg-chip">一</div>
          <div class="pg-chip">二</div>
          <div class="pg-chip">三</div>
        </Stack>
      </div>
    </div>
    <div class="pg-row">
      <code class="pg-tag">inline / gap=lg / align=center</code>
      <div class="pg-outline">
        <Stack direction="inline" gap="lg" align="center">
          <div class="pg-chip">低い</div>
          <div class="pg-chip pg-tall">高い</div>
          <div class="pg-chip">低い</div>
        </Stack>
      </div>
    </div>
  </section>

  <section>
    <h2>Grid</h2>
    <p>
      内在的な格子。列は min({gridMin})を下回らず、器に応じて増減する
      (メディアクエリなし)。右下の掴みで器をドラッグして確認する。
    </p>
    <label class="pg-field">
      min
      <input bind:value={gridMin} />
    </label>
    <div class="pg-resizable">
      <Grid min={gridMin} gap="sm">
        {#each ['一', '二', '三', '四', '五', '六'] as t (t)}
          <div class="pg-chip">カード {t}</div>
        {/each}
      </Grid>
    </div>
  </section>

  <section>
    <h2>Sidebar</h2>
    <p>
      2カラム。脇は内容幅(または sideWidth)で立ち、本体は fill。本体が contentMin
      (50%)を割ると縦へ折れる(条件は本体の窮屈さで、画面幅ではない)。
    </p>
    <label class="pg-field">
      side
      <select bind:value={sidebarSide}>
        <option value="start">start(脇が先)</option>
        <option value="end">end(本体が先)</option>
      </select>
    </label>
    <div class="pg-resizable">
      <Sidebar side={sidebarSide} sideWidth="12rem" gap="md">
        {#snippet sideSlot()}
          <div class="pg-chip">ナビ(脇)</div>
        {/snippet}
        <div class="pg-chip">本体。器を狭めると縦積みへ折れ、DOM 順は変わらない。</div>
      </Sidebar>
    </div>
  </section>

  <section>
    <h2>Cluster</h2>
    <p>項目ごとに流れる折返し(全体の一斉切替は Switcher)。器を狭めると行送りされる。</p>
    <div class="pg-resizable">
      <Cluster gap="sm">
        {#each ['設計', 'トークン', '契約', '散文', '適合', '実測', 'レビュー', '裁定', '配信'] as t (t)}
          <div class="pg-chip">{t}</div>
        {/each}
      </Cluster>
    </div>
  </section>
</main>

<style>
  .pg {
    max-width: 60rem;
    margin: 0 auto;
    padding: var(--spacing-inset-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-gap-lg);
  }
  .pg-header p,
  section > p {
    color: var(--color-app-fg-muted, inherit);
    margin: 0.25rem 0 0.75rem;
  }
  h1 {
    font-size: var(--typography-title-lg-font-size, 1.5rem);
    margin: 0;
  }
  h2 {
    font-size: var(--typography-title-sm-font-size, 1.125rem);
    margin: 0 0 0.25rem;
    border-block-end: 1px solid var(--color-semantic-plain-border, currentColor);
    padding-block-end: 0.25rem;
  }
  .pg-controls,
  .pg-field {
    display: flex;
    gap: var(--spacing-gap-md);
    align-items: center;
    margin-block-end: var(--spacing-stack-sm);
  }
  .pg-row {
    display: flex;
    gap: var(--spacing-gap-md);
    align-items: start;
    margin-block-end: var(--spacing-stack-sm);
  }
  .pg-tag {
    flex: 0 0 10rem;
    opacity: 0.7;
  }
  .pg-resizable {
    resize: horizontal;
    overflow: auto;
    border: 1px dashed var(--color-semantic-plain-border, currentColor);
    padding: var(--spacing-inset-md);
    min-width: 16rem;
    max-width: 100%;
  }
  .pg-outline {
    border: 1px dashed var(--color-semantic-plain-border, currentColor);
  }
  .pg-chip {
    background: var(--color-semantic-plain-soft-bg, #eee);
    color: var(--color-semantic-plain-soft-fg, inherit);
    border-radius: var(--shape-semantic-control, 0.5rem);
    padding: var(--spacing-inset-sm);
  }
  .pg-tall {
    padding-block: var(--spacing-inset-lg);
  }
</style>
