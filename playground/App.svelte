<script lang="ts">
  import { StemcellProvider, Button, IconButton, Switcher, Box, Stack, Cluster, TextField, Select, Grid, Sidebar, Checkbox, Textarea, Switch, Icon, Radio, RadioGroup, Divider, Skeleton, Menu, Dialog, Drawer, Tooltip, Card, Link, Badge, Avatar, Tag, Alert, Text } from '../src/lib';
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
  let ship = $state('');
  let account = $state('personal');
  let lastAction = $state('(なし)');
  let dlgLight = $state(false);
  let dlgExplicit = $state(false);
  let drawerOpen = $state(false);
  let drawerSide = $state<'inline-start' | 'inline-end' | 'block-start' | 'block-end'>('inline-end');
  let fEmail = $state('a@b.com');
  let fSubscribe = $state(true);
  let fNotify = $state(true);
  let fShip = $state('exp');
  let fPlan = $state('pro');
  let tagFilters = $state<Record<string, boolean>>({ react: true, svelte: false, vue: false });
  let tagChips = $state(['デザイン', 'トークン', '契約']);
  let alertShown = $state(true);
  let alertLive = $state(false);


  const variants = ['filled', 'soft', 'outlined', 'text'] as const;
  const colors = ['primary', 'danger', 'warning', 'plain'] as const;
</script>

<StemcellProvider {theme} {density} />

<main class="pg">
  <header class="pg-header">
    <Text as="h1" variant="display-md">stemcell svelte playground</Text>
    <Text as="p" variant="body-sm" muted>
      実装済み部品を実物で触って確認する器(WORKFLOW §2-6)。配信物ではない。
    </Text>
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
    <Text as="h2" variant="title-lg">Button</Text>
    <Text as="p" variant="body-sm" muted>variant × color の全組。下段は size と disabled / block。</Text>
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
    <Text as="h2" variant="title-lg">Switcher</Text>
    <Text as="p" variant="body-sm" muted>
      右下の掴みで器の幅をドラッグして切替を確認する。器の幅が threshold
      ({threshold})未満で縦へ一斉に切り替わる(閾値駆動。rem 裁定済み)。
    </Text>
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
    <Text as="h2" variant="title-lg">IconButton</Text>
    <Text as="p" variant="body-sm" muted>
      Button の一種(契約 extends)。絵1つで名前は label(aria-label)。shape は control/pill から
      選べる(shape.md §6)。当たり判定は絵1つでも縮まない(size.md §4)。
    </Text>
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
    <Text as="h2" variant="title-lg">Divider</Text>
    <Text as="p" variant="body-sm" muted>区切る線。装飾(支援技術から隠れる)。stack=水平線 / inline=垂直線(論理方向)。余白は器(Stack/Cluster の gap)が持つ。</Text>
    <Stack gap="md">
      <Text variant="body-sm">上のブロック</Text>
      <Divider />
      <Text variant="body-sm">下のブロック</Text>
    </Stack>
    <Cluster gap="md">
      <Text variant="body-sm">左</Text>
      <Divider orientation="inline" />
      <Text variant="body-sm">中</Text>
      <Divider orientation="inline" />
      <Text variant="body-sm">右</Text>
    </Cluster>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Skeleton</Text>
    <Text as="p" variant="body-sm" muted>読み込み中の代役。text=文字行 / box=面 / circle=円。寸法は器か font に従う。reduced-motion で shimmer 停止。</Text>
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
    <Text as="h2" variant="title-lg">Card</Text>
    <Text as="p" variant="body-sm" muted>
      地の上の面(elevation surface の最初の消費者)。器であって意味を持たない(role なし)。押せない(裁定):
      リンクや操作は中身が担う。既定は影の面、outlined は影を消し中立 border で縁取る。
    </Text>
    <Grid min="14rem" gap="md">
      <Card>
        <Stack gap="sm">
          <Text variant="title-sm">影の面(既定)</Text>
          <Text variant="body-sm">関係のある内容を一枚に載せる。中の要素の角は同心角丸に従う。</Text>
          <Cluster gap="sm">
            <Button size="sm">操作</Button>
            <Link href="/docs">詳細を見る</Link>
          </Cluster>
        </Stack>
      </Card>
      <Card outlined>
        <Stack gap="sm">
          <Text variant="title-sm">枠の面(outlined)</Text>
          <Text variant="body-sm">影を消し、中立 border で縁取る。intent を持たないので variant は使わない。</Text>
        </Stack>
      </Card>
    </Grid>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Link</Text>
    <Text as="p" variant="body-sm" muted>
      場所が変わる(native <code>&lt;a href&gt;</code>)。文字の一種で、大きさ・字面は周囲を継承する
      (variant/size/typography を持たない)。下線は非色手がかり(WCAG 1.4.1)。external は新文脈遷移を
      target=_blank と rel=noopener(native の防御)で得て、非色アイコン ＋ 隠し告知で示す。
    </Text>
    <Stack gap="sm">
      <Text variant="body-sm">本文の中に <Link href="/docs">こういうリンク</Link> が現れる(周囲の文字サイズを継承する)。</Text>
      <Text as="p" variant="title-lg">大きな文でも <Link href="/docs">自分の大きさを主張しない</Link>。</Text>
      <Link href="https://example.com" external>外部サイトへ(新しいタブ)</Link>
    </Stack>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Badge</Text>
    <Text as="p" variant="body-sm" muted>
      状態や数の小さな印。読むもので押せない。数(count)と存在(dot)だけ。max(既定99)超は「{'{max}'}+」へ丸め、
      量の意味は保つ(存在へ降格しない)。色は報告の intent(danger/warning/success/info)、既定 info/filled。
      anchor を包むと隅へ重なる。
    </Text>
    <div class="pg-row">
      <code class="pg-tag">count / 丸め</code>
      <Cluster gap="md" align="center">
        <Badge count={3} />
        <Badge count={0} />
        <Badge count={120} max={99} color="danger" />
        <Badge count={8} color="success" variant="soft" />
        <Badge count={5} color="warning" />
      </Cluster>
    </div>
    <div class="pg-row">
      <code class="pg-tag">dot / anchor</code>
      <Cluster gap="lg" align="center">
        <Badge dot label="新着あり" color="danger" />
        <Badge count={12} color="danger">
          <IconButton label="通知"><Icon name="bookmark" /></IconButton>
        </Badge>
        <Badge dot label="未読メッセージあり" color="info">
          <IconButton label="メッセージ" variant="soft"><Icon name="menu" /></IconButton>
        </Badge>
      </Cluster>
    </div>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Avatar</Text>
    <Text as="p" variant="body-sm" muted>
      主体の顔。src 画像 → name のイニシャル、と退避しても寸法・全円・名前は不変(第7条)。寸法は avatar 段
      (24/32/40px。rem 建て)。イニシャルの切り出しは暫定規則(§5 の Normative 共有規則は ratify 待ち)。
      壊れた src はイニシャルへ退く実演を含む。
    </Text>
    <div class="pg-row">
      <code class="pg-tag">size / イニシャル</code>
      <Cluster gap="md" align="center">
        <Avatar name="山田太郎" size="sm" />
        <Avatar name="田中花子" size="md" />
        <Avatar name="Ada Lovelace" size="lg" />
        <Avatar name="Grace Hopper" />
      </Cluster>
    </div>
    <div class="pg-row">
      <code class="pg-tag">画像 / 退避</code>
      <Cluster gap="md" align="center">
        <Avatar name="Octocat" src="https://github.com/github.png" size="lg" />
        <Avatar name="退避 太郎" src="https://x.example/broken-404.png" size="lg" />
        <Badge dot label="オンライン" color="success">
          <Avatar name="在席 花子" size="lg" />
        </Badge>
      </Cluster>
    </div>
    <div class="pg-row">
      <code class="pg-tag">decorative</code>
      <Cluster gap="sm" align="center">
        <!-- 隣に可視の名前があるので装飾へ落とす(名前の二重読みを避ける。§3) -->
        <Avatar name="佐藤一郎" decorative />
        <Text variant="body-sm">佐藤一郎</Text>
      </Cluster>
    </div>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Tag</Text>
    <Text as="p" variant="body-sm" muted>
      分類の名札。静的(読むだけ)・選べる(selected の値を持つ絞り込みチップ)・消せる(dismissible)の3形は同じ
      部品。variant は soft(既定)/ outlined、色は plain 固定(分類は intent でない)。選択と削除は入れ子にせず
      兄弟に置き、× の名は本体ラベル + 削除語で合成。sm/md とも当たり判定は門(24px)を割らない。
    </Text>
    <div class="pg-row">
      <code class="pg-tag">静的</code>
      <Cluster gap="sm" align="center">
        <Tag>デザイン</Tag>
        <Tag variant="outlined">トークン</Tag>
        <Tag size="sm">契約(sm)</Tag>
        <Tag variant="outlined" size="sm">散文(sm)</Tag>
      </Cluster>
    </div>
    <div class="pg-row">
      <code class="pg-tag">選べる(絞り込み)</code>
      <Cluster gap="sm" align="center">
        {#each [['react', 'React'], ['svelte', 'Svelte'], ['vue', 'Vue']] as [id, name] (id)}
          <Tag selected={tagFilters[id]} onclick={() => (tagFilters[id] = !tagFilters[id])}>{name}</Tag>
        {/each}
        <Text variant="body-sm">選択中: {Object.entries(tagFilters).filter(([, v]) => v).map(([k]) => k).join(', ') || '(なし)'}</Text>
      </Cluster>
    </div>
    <div class="pg-row">
      <code class="pg-tag">消せる</code>
      <Cluster gap="sm" align="center">
        {#each tagChips as chip (chip)}
          <Tag dismissible dismissLabel="{chip} を削除" ondismiss={() => (tagChips = tagChips.filter((c) => c !== chip))}>{chip}</Tag>
        {/each}
        {#if tagChips.length === 0}<Text variant="body-sm">(すべて削除済み)</Text>{/if}
        <Button size="sm" variant="text" onclick={() => (tagChips = ['デザイン', 'トークン', '契約'])}>戻す</Button>
      </Cluster>
    </div>
    <div class="pg-row">
      <code class="pg-tag">選択+削除 / disabled</code>
      <Cluster gap="sm" align="center">
        <Tag selected={tagFilters.react} dismissible onclick={() => (tagFilters.react = !tagFilters.react)} ondismiss={() => (tagFilters.react = false)}>React(選択+×)</Tag>
        <Tag selected={false} disabled>選べる disabled</Tag>
        <Tag dismissible disabled>消せる disabled</Tag>
      </Cluster>
    </div>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Alert</Text>
    <Text as="p" variant="body-sm" muted>
      文での報告。その場に留まり状況が続く限り読める(勝手に消えるのは Toast)。intent の4色、先頭に intent の
      絵(色だけで種類を伝えない。1.4.1)。割り込みの度合いは intent から: danger だけ即時(role=alert)、他は
      穏当(role=status)。既定は閉じられない(dismissible で × を出す。× の名は 文脈 + 閉じる語 を合成)。
    </Text>
    <Stack gap="md">
      <Alert color="info">
        {#snippet title()}お知らせ{/snippet}
        新しいバージョンが利用できます。設定から更新してください。
      </Alert>
      <Alert color="success">保存しました。</Alert>
      <Alert color="warning">
        {#snippet title()}下書きのまま{/snippet}
        公開する前に、未入力の項目があります。
      </Alert>
      <Alert color="danger">
        {#snippet title()}保存に失敗しました{/snippet}
        ネットワークを確認して <Link href="/retry" onclick={(e) => e.preventDefault()}>再試行</Link> してください。
      </Alert>
      {#if alertShown}
        <Alert color="warning" dismissible dismissLabel="閉じる" ondismiss={() => (alertShown = false)}>
          {#snippet title()}消せる報告{/snippet}
          × で閉じられます(取り除くのはアプリ。Alert は自分を消さない)。
        </Alert>
      {:else}
        <Button size="sm" variant="text" onclick={() => (alertShown = true)}>消せる報告を戻す</Button>
      {/if}
      <div class="pg-row">
        <code class="pg-tag">動的挿入(割り込み)</code>
        <Cluster gap="sm" align="center">
          <Button size="sm" onclick={() => (alertLive = !alertLive)}>
            {alertLive ? '消す' : 'エラーを出す(role=alert が割り込む)'}
          </Button>
          {#if alertLive}
            <Alert color="danger">初期描画に無い Alert は挿入時に読み上げへ割り込む(role=alert)。</Alert>
          {/if}
        </Cluster>
      </div>
    </Stack>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Text</Text>
    <Text as="p" variant="body-sm" muted>
      content に typography 役割を当てる原始。多相 as(意味要素)と視覚役割 variant を分離する。既定は
      中立の span。muted は副次色、truncate は1行省略(全文は DOM に残る)。
    </Text>
    <Stack gap="sm">
      <Text as="h3" variant="headline-md">見出し(as=h3, variant=headline-md)</Text>
      <Text as="p" variant="body-md">
        本文(as=p, variant=body-md)。段落として読みやすさを最優先する役割。
      </Text>
      <Text as="p" variant="body-sm" muted>副次の本文(muted)。補助的な説明に。</Text>
      <Text as="span" variant="label-sm" muted>ラベル / キャプション(label-sm, muted)</Text>
      <Text variant="mono-md">const code = "mono-md";</Text>
      <!-- 同じ variant を別の階層に当てられる(見た目と意味の分離) -->
      <Text as="h4" variant="body-lg">同じ body-lg を見出し要素(h4)に当てた例</Text>
      <div style="inline-size: 16rem; border: 1px dashed var(--color-semantic-plain-border);">
        <Text as="p" variant="body-md" truncate>
          truncate は長い一行を器の幅で省略する。この文は器より長いので末尾が … で切れる。
        </Text>
      </div>
    </Stack>
  </section>

  <section>
    <Text as="h2" variant="title-lg">TextField</Text>
    <Text as="p" variant="body-sm" muted>
      複合フィールド(label / description / error 内包)。エラー文は danger.soft-fg の転用
      (実測 10.45:1 / 11.04:1)。invalid は8文字未満で立つ(逐次 change のデモ)。
    </Text>
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
    <Text as="h2" variant="title-lg">Select</Text>
    <Text as="p" variant="body-sm" muted>
      二経路(RFC 0007 の B2)。pointer はカスタム combobox+listbox(リッチ選択肢・aria-activedescendant・
      Popover を合成)、touch(pointer:coarse)は native select に切替。開閉はコンポーネント内部が所有、
      light dismiss(外側/Escape)。invalid は未選択で立つ。
    </Text>
    <Stack gap="lg">
      <Select
        bind:value={ship}
        placeholder="配送方法を選択"
        required
        invalid={ship === ''}
        options={[
          { value: 'std', label: '通常配送', icon: 'menu', description: '3〜5営業日' },
          { value: 'exp', label: '速達', icon: 'arthmetic.plus', description: '翌日着' },
          { value: 'pick', label: '店舗受取', icon: 'search', description: '最寄り店で受け取り' },
          { value: 'frz', label: '冷凍便(法人のみ)', icon: 'delete', disabled: true },
        ]}
      >
        {#snippet label()}配送方法{/snippet}
        {#snippet description()}リッチ選択肢(アイコン ＋ 副文){/snippet}
        {#snippet error()}選択が必要{/snippet}
      </Select>
      <Stack gap="md">
        <Select size="sm" bind:value={account} options={[{ value: 'personal', label: '個人' }, { value: 'business', label: '法人' }]}>
          {#snippet label()}sm{/snippet}
        </Select>
        <Select size="lg" bind:value={account} options={[{ value: 'personal', label: '個人' }, { value: 'business', label: '法人' }]}>
          {#snippet label()}lg{/snippet}
        </Select>
        <Select disabled value="personal" options={[{ value: 'personal', label: '個人' }]}>
          {#snippet label()}disabled{/snippet}
        </Select>
      </Stack>
    </Stack>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Menu</Text>
    <Text as="p" variant="body-sm" muted>
      アクションの集合を畳んで出す(APG の menu button + menu)。トリガーは Menu が所有し、中への移動は実 DOM
      フォーカスの roving。選ぶと活性化して閉じ、フォーカスはトリガーへ戻る。値は持たない(行為であって選択でない)。
    </Text>
    <Cluster gap="md">
      <Menu
        items={[
          { id: 'edit', label: '編集', icon: 'pencil' },
          { id: 'duplicate', label: '複製', icon: 'clipboard' },
          { id: 'share', label: '共有', icon: 'share', description: 'リンクを発行して渡す' },
          { id: 'archive', label: 'アーカイブ', disabled: true },
          { id: 'delete', label: '削除', icon: 'delete' },
        ]}
        onselect={(id) => (lastAction = id)}
      >
        {#snippet trigger()}操作<Icon name="chevron.down" />{/snippet}
      </Menu>
      <Menu
        size="sm"
        items={[
          { id: 'rename', label: '名前を変更' },
          { id: 'move', label: '移動' },
        ]}
        onselect={(id) => (lastAction = id)}
      >
        {#snippet trigger()}<Icon name="dots.horizontal" />{/snippet}
      </Menu>
      <Menu disabled items={[{ id: 'x', label: 'なし' }]} onselect={() => {}}>
        {#snippet trigger()}無効{/snippet}
      </Menu>
    </Cluster>
    <Text as="p" variant="body-sm" muted>最後に選んだ操作: {lastAction}</Text>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Dialog</Text>
    <Text as="p" variant="body-sm" muted>
      ビューポート中央の modal(native <code>&lt;dialog&gt;</code> + showModal)。focus trap・top-layer・scrim・
      Escape・背後 inert は標準が無償で満たす(憲法 第2条)。開閉はアプリが所有。light は Escape / 背後クリックで
      閉じ、explicit はボタンでのみ閉じる。
    </Text>
    <Cluster gap="md">
      <Button onclick={() => (dlgLight = true)}>light を開く</Button>
      <Button variant="outlined" color="danger" onclick={() => (dlgExplicit = true)}>explicit(削除確認)</Button>
    </Cluster>

    <Dialog bind:open={dlgLight} onopenchange={(o) => (dlgLight = o)}>
      {#snippet title()}お知らせ{/snippet}
      {#snippet content()}
        <Stack gap="sm">
          <Text variant="body-sm">これは light dismiss の Dialog です。Escape か背後(scrim)クリックで閉じます。</Text>
          <Text variant="body-sm">フォーカスは中に捕捉され、閉じると開いたボタンへ戻ります。</Text>
        </Stack>
      {/snippet}
      {#snippet actions()}
        <Button variant="outlined" color="plain" onclick={() => (dlgExplicit = true)}>確認を重ねて開く</Button>
        <Button variant="text" color="plain" onclick={() => (dlgLight = false)}>閉じる</Button>
      {/snippet}
    </Dialog>

    <Dialog bind:open={dlgExplicit} dismiss="explicit" onopenchange={(o) => (dlgExplicit = o)}>
      {#snippet title()}本当に削除しますか{/snippet}
      {#snippet content()}この操作は取り消せません。explicit なので Escape / 背後クリックでは閉じません。{/snippet}
      {#snippet actions()}
        <Button variant="text" color="plain" onclick={() => (dlgExplicit = false)}>取消</Button>
        <Button color="danger" onclick={() => (dlgExplicit = false)}>削除</Button>
      {/snippet}
    </Dialog>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Drawer</Text>
    <Text as="p" variant="body-sm" muted>
      端に寄る modal(native <code>&lt;dialog&gt;</code>。Dialog と同じ土台、位置と入りの方向だけ違う)。side は
      論理方向(RTL 自動反転)。Sidebar(常設レイアウト)と違い一時的で scrim が背後を封じる。
    </Text>
    <Cluster gap="md">
      <Button onclick={() => { drawerSide = 'inline-end'; drawerOpen = true; }}>右から開く</Button>
      <Button variant="outlined" color="plain" onclick={() => { drawerSide = 'inline-start'; drawerOpen = true; }}>左から</Button>
      <Button variant="outlined" color="plain" onclick={() => { drawerSide = 'block-end'; drawerOpen = true; }}>下から</Button>
    </Cluster>
    <Drawer bind:open={drawerOpen} side={drawerSide} onopenchange={(o) => (drawerOpen = o)}>
      {#snippet title()}フィルタ{/snippet}
      {#snippet content()}
        <Stack gap="md">
          <Text variant="body-sm">side={drawerSide} の Drawer。Escape / 背後クリックで閉じます(light)。その端からスライドします。</Text>
          <Text variant="body-sm">Dialog と同じ土台(native &lt;dialog&gt;)で、位置と入りの方向だけが違います。</Text>
        </Stack>
      {/snippet}
      {#snippet actions()}
        <Button variant="text" color="plain" onclick={() => (drawerOpen = false)}>閉じる</Button>
        <Button onclick={() => (drawerOpen = false)}>適用</Button>
      {/snippet}
    </Drawer>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Tooltip</Text>
    <Text as="p" variant="body-sm" muted>
      アンカーに添える短い補助ラベル。hover と focus の両方で開き、離脱と Escape で閉じる。フォーカスを受け取らず
      必須情報は置かない(補強)。native popover(top-layer)+ Anchor Positioning で切れない。
    </Text>
    <Cluster gap="lg">
      <Tooltip>
        {#snippet trigger()}<Button variant="outlined" color="plain">保存</Button>{/snippet}
        {#snippet content()}変更をサーバーへ保存します{/snippet}
      </Tooltip>
      <Tooltip placement="block-end">
        {#snippet trigger()}<IconButton label="設定"><Icon name="dots.horizontal" /></IconButton>{/snippet}
        {#snippet content()}設定(下に出る tooltip){/snippet}
      </Tooltip>
    </Cluster>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Box</Text>
    <Text as="p" variant="body-sm" muted>内在スタイルの器。inset は段(sm/md/lg)と大域の原始 X(8〜24)。</Text>
    <Cluster gap="sm">
      {#each ['sm', 'md', 'lg', '12'] as inset (inset)}
        <div class="pg-outline">
          <Box {inset}><code>inset="{inset}"</code></Box>
        </div>
      {/each}
    </Cluster>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Stack</Text>
    <Text as="p" variant="body-sm" muted>間隔を所有する縦/横の並び(中身は外側 margin を持たない)。</Text>
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
    <Text as="h2" variant="title-lg">Icon</Text>
    <Text as="p" variant="body-sm" muted>
      語彙を絵で示す描画器。色は currentColor(文字色を継承)、寸法は 1em(font-size に追従)。
      既定は装飾で支援技術から隠れ、label を付けると意味を運ぶ。
    </Text>
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
        <Text variant="body-sm">name(全束)と glyph(使う分だけ)の二口。iconography.md §6</Text>
      </Cluster>
    </div>
  </section>

  <section>
    <Text as="h2" variant="title-lg">RadioGroup / Radio</Text>
    <Text as="p" variant="body-sm" muted>
      相互排他の集合。値はグループが1つ持つ(項目は checked を持たない)。矢印キーで移動=選択、
      Tab はグループに1つ(選択済みへ)。矢印キー・roving tabindex は native radio に任せる。
    </Text>
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
    <Text as="p" variant="body-sm" muted>選択中: {size ?? '(未選択)'}</Text>
    <Text as="p" variant="body-sm" muted>選択済みかつ invalid(不正な組み合わせ。枠は danger・塗りは primary):</Text>
    <RadioGroup value="m" invalid>
      {#snippet label()}選択済み × invalid{/snippet}
      {#snippet error()}この組み合わせは不正です{/snippet}
      <Radio value="s">{#snippet label()}s{/snippet}</Radio>
      <Radio value="m">{#snippet label()}m(選択済み){/snippet}</Radio>
    </RadioGroup>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Textarea</Text>
    <Text as="p" variant="body-sm" muted>複数行入力。TextField を継承(extends)し、start / end は持たない。縦リサイズ可。</Text>
    <Textarea bind:value={bio} rows={4} invalid={bio.length > 20}>
      {#snippet label()}自己紹介{/snippet}
      {#snippet description()}20字以内(現在 {bio.length}字){/snippet}
      {#snippet error()}長すぎる{/snippet}
    </Textarea>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Switch</Text>
    <Text as="p" variant="body-sm" muted>独立した設定の on / off(即時反映。field.md §7)。invalid / required を持たない。</Text>
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
    <Text as="h2" variant="title-lg">Checkbox</Text>
    <Text as="p" variant="body-sm" muted>
      集合からの選択・同意(field.md §7)。リッチ label(リンク内包)の二重発火防止と、
      親の indeterminate(集計表示)を実演する。checked は primary の塗り、未チェックの hover は
      plain のウォッシュ。
    </Text>
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
    <Text as="h2" variant="title-lg">Grid</Text>
    <Text as="p" variant="body-sm" muted>
      内在的な格子。列は min({gridMin})を下回らず、器に応じて増減する
      (メディアクエリなし)。右下の掴みで器をドラッグして確認する。
    </Text>
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
    <Text as="h2" variant="title-lg">Sidebar</Text>
    <Text as="p" variant="body-sm" muted>
      2カラム。脇は内容幅(または sideWidth)で立ち、本体は fill。本体が contentMin
      (50%)を割ると縦へ折れる(条件は本体の窮屈さで、画面幅ではない)。
    </Text>
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
    <Text as="h2" variant="title-lg">Cluster</Text>
    <Text as="p" variant="body-sm" muted>項目ごとに流れる折返し(全体の一斉切替は Switcher)。器を狭めると行送りされる。</Text>
    <div class="pg-resizable">
      <Cluster gap="sm">
        {#each ['設計', 'トークン', '契約', '散文', '適合', '実測', 'レビュー', '裁定', '配信'] as t (t)}
          <div class="pg-chip">{t}</div>
        {/each}
      </Cluster>
    </div>
  </section>

  <section>
    <Text as="h2" variant="title-lg">Form participation</Text>
    <Text as="p" variant="body-sm" muted>
      name を与えると native の <code>&lt;form&gt;</code> 送信・FormData・reset に参加する(controlled と両立。
      field.md §5)。TextField は keyboard=email で native <code>type="email"</code>、RadioGroup は required を各
      radio へ配線。
    </Text>
    <form id="pg-form" onsubmit={(e) => e.preventDefault()}>
      <Stack gap="md">
        <TextField name="email" keyboard="email" bind:value={fEmail}>
          {#snippet label()}メール(name=email, type=email){/snippet}
        </TextField>
        <Checkbox name="subscribe" bind:checked={fSubscribe}>
          {#snippet label()}購読する(name=subscribe){/snippet}
        </Checkbox>
        <Switch name="notify" bind:checked={fNotify}>
          {#snippet label()}通知(name=notify){/snippet}
        </Switch>
        <Select
          name="ship"
          bind:value={fShip}
          placeholder="配送を選択"
          options={[{ value: 'std', label: '通常' }, { value: 'exp', label: '速達' }]}
        >
          {#snippet label()}配送(name=ship){/snippet}
        </Select>
        <RadioGroup name="plan" required bind:value={fPlan}>
          {#snippet label()}プラン(name=plan, required){/snippet}
          <Radio value="free">{#snippet label()}無料{/snippet}</Radio>
          <Radio value="pro">{#snippet label()}Pro{/snippet}</Radio>
        </RadioGroup>
      </Stack>
    </form>
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
  /* Text はレイアウトに余白を委ねる(自身は margin:0)。playground の section / header 直下の見出し・説明の
     縦余白は :global で Text の要素へ戻す(scoped セレクタは別スコープの Text 要素へ届かないため)。
     見出しの typography は Text の variant が持つので、ここでは余白だけを扱う。 */
  .pg-header > :global(.sc-text),
  section > :global(.sc-text) {
    margin-block-end: var(--spacing-stack-sm);
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
