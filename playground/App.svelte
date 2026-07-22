<script lang="ts">
  import { StemcellProvider, Button, IconButton, Switcher, Box, Stack, Cluster, TextField, Grid, Sidebar, Checkbox, Textarea, Switch, Icon, Radio, RadioGroup, Divider, Skeleton } from '../src/lib';
  import checkGlyph from '@stemcell/icons/check';

  let size = $state<string | undefined>(undefined);
  let sizeTouched = $state(false);

  let theme = $state<'auto' | 'standard-light' | 'standard-dark'>('auto');
  let density = $state<'comfortable' | 'compact'>('comfortable');
  let threshold = $state('30rem');
  let invite = $state('abc');
  let gridMin = $state('16rem');
  let sidebarSide = $state<'start' | 'end'>('start');
  let agree = $state(false);
  let agreeTouched = $state(false);
  let toppings = $state({ cheese: true, tomato: false });
  let bio = $state('');
  let notify = $state(true);


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
    <h2>IconButton</h2>
    <p>
      Button の一種(契約 extends)。絵1つで名前は label(aria-label)。shape は control/pill から
      選べる(shape.md §6)。当たり判定は絵1つでも縮まない(size.md §4)。
    </p>
    <Cluster gap="md">
      <IconButton label="検索"><Icon name="search" /></IconButton>
      <IconButton label="メニュー" variant="soft"><Icon name="menu" /></IconButton>
      <IconButton label="その他" variant="outlined"><Icon name="dots.horizontal" /></IconButton>
      <IconButton label="削除" variant="text" color="danger"><Icon name="delete" /></IconButton>
      <IconButton label="追加" shape="pill"><Icon name="arthmetic.plus" /></IconButton>
      <IconButton label="閉じる" disabled><Icon name="close" /></IconButton>
    </Cluster>
    <Cluster gap="md">
      <IconButton label="小" size="sm"><Icon name="search" /></IconButton>
      <IconButton label="中" size="md"><Icon name="search" /></IconButton>
      <IconButton label="大" size="lg"><Icon name="search" /></IconButton>
      <IconButton label="全円 sm" shape="pill" size="sm" variant="soft"><Icon name="menu" /></IconButton>
      <IconButton label="全円 lg" shape="pill" size="lg" variant="soft"><Icon name="menu" /></IconButton>
    </Cluster>
  </section>

  <section>
    <h2>Divider</h2>
    <p>区切る線。装飾(支援技術から隠れる)。stack=水平線 / inline=垂直線(論理方向)。余白は器(Stack/Cluster の gap)が持つ。</p>
    <Stack gap="md">
      <span>上のブロック</span>
      <Divider />
      <span>下のブロック</span>
    </Stack>
    <Cluster gap="md">
      <span>左</span>
      <Divider orientation="inline" />
      <span>中</span>
      <Divider orientation="inline" />
      <span>右</span>
    </Cluster>
  </section>

  <section>
    <h2>Skeleton</h2>
    <p>読み込み中の代役。text=文字行 / box=面 / circle=円。寸法は器か font に従う。reduced-motion で shimmer 停止。</p>
    <Cluster gap="md">
      <div style="inline-size: 3rem; block-size: 3rem;"><Skeleton form="circle" /></div>
      <Stack gap="sm">
        <div style="inline-size: 14rem;"><Skeleton form="text" /></div>
        <div style="inline-size: 10rem;"><Skeleton form="text" /></div>
      </Stack>
    </Cluster>
    <div style="inline-size: 14rem; block-size: 6rem;"><Skeleton form="box" /></div>
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
        {#snippet end()}<IconButton label="消去" variant="text" size="sm"><Icon name="close" /></IconButton>{/snippet}
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
    <h2>Icon</h2>
    <p>
      語彙を絵で示す描画器。色は currentColor(文字色を継承)、寸法は 1em(font-size に追従)。
      既定は装飾で支援技術から隠れ、label を付けると意味を運ぶ。
    </p>
    <div class="pg-row">
      <code class="pg-tag">currentColor</code>
      <Cluster gap="md" align="center">
        <span style="color: var(--color-semantic-primary-bg)"><Icon name="check" /></span>
        <span style="color: var(--color-semantic-danger-bg)"><Icon name="delete" /></span>
        <Icon name="search" label="検索" />
        <Icon name="setting" />
        <Icon name="bookmark" />
        <Icon name="bookmark.fill" />
        <Icon name="star" />
        <Icon name="star.half" />
        <Icon name="star.fill" />
      </Cluster>
    </div>
    <div class="pg-row">
      <code class="pg-tag">1em(font-size 追従)</code>
      <Cluster gap="md" align="center">
        <span style="font-size: 1rem"><Icon name="love" /></span>
        <span style="font-size: 1.5rem"><Icon name="love" /></span>
        <span style="font-size: 2.5rem"><Icon name="love" /></span>
        <span style="font-size: 1rem">テキストと並ぶ <Icon name="chevron.right" /> 絵</span>
      </Cluster>
    </div>
    <div class="pg-row">
      <code class="pg-tag">RTL 反転</code>
      <Cluster gap="lg" align="center">
        <span dir="ltr">LTR: <Icon name="arrow.left" /> <Icon name="arrow.right" /></span>
        <span dir="rtl">RTL: <Icon name="arrow.left" /> <Icon name="arrow.right" /></span>
        <span dir="rtl">整列は不変: <Icon name="text_align.left" /></span>
      </Cluster>
    </div>
    <div class="pg-row">
      <code class="pg-tag">Button 内</code>
      <Button>{#snippet start()}<Icon name="file.download" />{/snippet}保存</Button>
    </div>
    <div class="pg-row">
      <code class="pg-tag">glyph 渡し</code>
      <Cluster gap="md" align="center">
        <Icon glyph={checkGlyph} label="完了(静的・ツリーシェイク)" />
        <span>name(全束)と glyph(使う分だけ)の二口。iconography.md §6</span>
      </Cluster>
    </div>
  </section>

  <section>
    <h2>RadioGroup / Radio</h2>
    <p>
      相互排他の集合。値はグループが1つ持つ(項目は checked を持たない)。矢印キーで移動=選択、
      Tab はグループに1つ(選択済みへ)。矢印キー・roving tabindex は native radio に任せる。
    </p>
    <RadioGroup
      value={size}
      required
      invalid={sizeTouched && !size}
      onchange={(v) => { size = v; sizeTouched = true; }}
    >
      {#snippet label()}配送サイズ{/snippet}
      {#snippet description()}ひとつ選んでください{/snippet}
      {#snippet error()}サイズの選択が必要です{/snippet}
      <Radio value="s">
        {#snippet label()}small{/snippet}
        {#snippet description()}〜60cm{/snippet}
      </Radio>
      <Radio value="m">
        {#snippet label()}medium{/snippet}
        {#snippet description()}〜100cm{/snippet}
      </Radio>
      <Radio value="l" disabled>
        {#snippet label()}large(在庫切れ){/snippet}
      </Radio>
    </RadioGroup>
    <p>選択中: {size ?? '(未選択)'}</p>
    <p>選択済みかつ invalid(不正な組み合わせ。枠は danger・塗りは primary):</p>
    <RadioGroup value="m" invalid>
      {#snippet label()}選択済み × invalid{/snippet}
      {#snippet error()}この組み合わせは不正です{/snippet}
      <Radio value="s">{#snippet label()}s{/snippet}</Radio>
      <Radio value="m">{#snippet label()}m(選択済み){/snippet}</Radio>
    </RadioGroup>
  </section>

  <section>
    <h2>Textarea</h2>
    <p>複数行入力。TextField を継承(extends)し、start / end は持たない。縦リサイズ可。</p>
    <Textarea bind:value={bio} rows={4} invalid={bio.length > 20}>
      {#snippet label()}自己紹介{/snippet}
      {#snippet description()}20字以内(現在 {bio.length}字){/snippet}
      {#snippet error()}長すぎる{/snippet}
    </Textarea>
  </section>

  <section>
    <h2>Switch</h2>
    <p>独立した設定の on / off(即時反映。field.md §7)。invalid / required を持たない。</p>
    <Stack gap="sm">
      <Switch bind:checked={notify}>
        {#snippet label()}通知を受け取る{/snippet}
        {#snippet description()}メールとプッシュで届く{/snippet}
      </Switch>
      <Switch disabled>
        {#snippet label()}disabled(off){/snippet}
      </Switch>
      <Switch checked disabled>
        {#snippet label()}disabled(on){/snippet}
      </Switch>
    </Stack>
  </section>

  <section>
    <h2>Checkbox</h2>
    <p>
      集合からの選択・同意(field.md §7)。リッチ label(リンク内包)の二重発火防止と、
      親の indeterminate(集計表示)を実演する。checked は primary の塗り、未チェックの hover は
      plain のウォッシュ。
    </p>
    <Stack gap="md">
      <!-- invalid は操作後(離脱)にだけ立てる。field.md §3: エラー判定は入力完了まで待つ -->
      <Checkbox
        checked={agree}
        required
        invalid={agreeTouched && !agree}
        onchange={(c) => { agree = c; agreeTouched = true; }}
      >
        {#snippet label()}
          <a href="/terms" onclick={(e) => e.preventDefault()}>利用規約</a>に同意する
        {/snippet}
        {#snippet description()}続行には同意が必要{/snippet}
        {#snippet error()}同意してください{/snippet}
      </Checkbox>

      <Checkbox
        checked={toppings.cheese && toppings.tomato}
        indeterminate={toppings.cheese !== toppings.tomato}
        onchange={(c) => (toppings = { cheese: c, tomato: c })}
      >
        {#snippet label()}トッピング全部(親){/snippet}
      </Checkbox>
      <Box inset="8">
        <Stack gap="sm">
          <Checkbox bind:checked={toppings.cheese}>
            {#snippet label()}チーズ{/snippet}
          </Checkbox>
          <Checkbox bind:checked={toppings.tomato}>
            {#snippet label()}トマト{/snippet}
          </Checkbox>
        </Stack>
      </Box>

      <Cluster gap="md">
        <Checkbox checked disabled>
          {#snippet label()}disabled(checked){/snippet}
        </Checkbox>
        <Checkbox disabled>
          {#snippet label()}disabled{/snippet}
        </Checkbox>
      </Cluster>
    </Stack>
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
        {#snippet aside()}
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
