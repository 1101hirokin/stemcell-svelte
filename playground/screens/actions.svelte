<script lang="ts">
  import { Button, IconButton, Stack, Cluster, Icon, Link, Text } from '../../src/lib';
  import checkGlyph from '@stemcell/icons/check';

  const variants = ['filled', 'soft', 'outlined', 'text'] as const;
  const colors = ['primary', 'danger', 'warning', 'plain'] as const;
</script>

  <section>
    <Text as="h3" variant="title-lg">Button</Text>
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
    <Text as="h3" variant="title-lg">IconButton</Text>
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
    <Text as="h3" variant="title-lg">Link</Text>
    <Text as="p" variant="body-sm" muted>
      場所が変わる(native <code>&lt;a href&gt;</code>)。文字の一種で、大きさ・字面は周囲を継承する
      (variant/size/typography を持たない)。下線は非色手がかり(WCAG 1.4.1)。external は新文脈遷移を
      target=_blank と rel=noopener(native の防御)で得て、非色アイコン ＋ 隠し告知で示す。
    </Text>
    <Stack gap="sm">
      <Text variant="body-sm">本文の中に <Link href="/docs">こういうリンク</Link> が現れる(周囲の文字サイズを継承する)。</Text>
      <Text as="p" variant="title-md">大きな文でも <Link href="/docs">自分の大きさを主張しない</Link>。</Text>
      <Link href="https://example.com" external>外部サイトへ(新しいタブ)</Link>
    </Stack>
  </section>
  <section>
    <Text as="h3" variant="title-lg">Icon</Text>
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
        <Text variant="body-sm">name(全束)と glyph(使う分だけ)の二つ。iconography.md §6</Text>
      </Cluster>
    </div>
  </section>
