<script lang="ts">
  import {
    Button, IconButton, Stack, Cluster, Icon, Divider, Badge, Avatar, Tag, Text, Code, CodeBlock, EmptyState, Card, Stat, Grid, toast,
  } from '../../src/lib';

  // コードの塊(CodeBlock)。値は文字列で、着色は器の外。ここでは素のまま(器械を入れていない)
  const sample = `type Order = { id: string; total: number };

// 直近の注文を合計する
export function sum(orders: Order[]): number {
  return orders.reduce((acc, o) => acc + o.total, 0); // 円
}`;
  const longLine = 'const veryLongIdentifierForTestingHorizontalScroll = { alpha: 1, beta: 2, gamma: 3, delta: 4, epsilon: 5, zeta: 6 };';
  const highlighted = {
    text: "const total = orders.reduce((a, o) => a + o.total, 0); // 円\ntype Order = { id: string; label: '注文' };",
  };
  let wrap = $state(false);
  let lineNumbers = $state(true);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast('コードを複写しました');
  };

  let tagFilters = $state<Record<string, boolean>>({ react: true, svelte: false, vue: false });
  let tagChips = $state(['デザイン', 'トークン', '契約']);
</script>

  <section>
    <Text as="h3" variant="title-lg">Text</Text>
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
    <Text as="h3" variant="title-lg">Divider</Text>
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
    <Text as="h3" variant="title-lg">Badge</Text>
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
    <Text as="h3" variant="title-lg">Avatar</Text>
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
    <Text as="h3" variant="title-lg">Tag</Text>
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
    <Text as="h3" variant="title-lg">Code / CodeBlock(コード)</Text>
    <Text as="p" variant="body-sm" muted>
      文中のコードは <Code>Code</Code>、塊は <Code>CodeBlock</Code>。塊は値を文字列で受け取り、着色は器の外に
      置く(色だけ DS が持つ)。既定は折らずに横へ送り、溢れているときだけ焦点を受ける。ヘッダーは場所だけ
      で、複写ボタンはアプリが置く。
    </Text>
    <div class="pg-row">
      <code class="pg-tag">文中</code>
      <Text variant="body-md">
        まず <Code>npm install @stemcell/svelte</Code> を実行し、<Code>--force</Code> は付けない。
      </Text>
    </div>
    <Cluster gap="md" align="center">
      <Button size="sm" variant="outlined" color="plain" onclick={() => (wrap = !wrap)}>
        折り返し: {wrap ? 'する' : 'しない'}
      </Button>
      <Button size="sm" variant="outlined" color="plain" onclick={() => (lineNumbers = !lineNumbers)}>
        行番号: {lineNumbers ? 'あり' : 'なし'}
      </Button>
    </Cluster>
    <CodeBlock code={`${sample}\n${longLine}`} language="ts" label="注文の合計のコード" {wrap} {lineNumbers}>
      {#snippet header()}
        <Text variant="label-sm">orders.ts</Text>
        <IconButton label="コードを複写する" size="sm" variant="text" color="plain" onclick={() => copy(`${sample}\n${longLine}`)}>
          <Icon name="clipboard" />
        </IconButton>
      {/snippet}
    </CodeBlock>
    <Text as="p" variant="body-sm" muted>
      着色済みの中身を差した例(器械は入れていないので、Prism が吐く形の印を手で書いている)。色は DS が
      持つ6役(comment / keyword / string / number / function / type)で、器械が無ければ本文の色で描かれる。
    </Text>
    <CodeBlock code={highlighted.text} language="ts" label="着色した例のコード">
      {#snippet children()}<span class="token keyword">const</span> total <span class="token keyword">=</span> orders<span class="token function">.reduce</span>((a, o) =&gt; a <span class="token keyword">+</span> o.total, <span class="token number">0</span>); <span class="token comment">// 円</span>{'\n'}<span class="token keyword">type</span> <span class="token class-name">Order</span> = &lbrace; id: <span class="token class-name">string</span>; label: <span class="token string">'注文'</span> &rbrace;;{/snippet}
    </CodeBlock>
  </section>

  <section>
    <Text as="h3" variant="title-lg">EmptyState(空状態)</Text>
    <Text as="p" variant="body-sm" muted>
      空は正常な状態である。器は何が無いのかを言葉にし、次にできることを置く場所を持つ。失敗は扱わない
      (空は正常、失敗は異常)。0 件になったことの告知も持たない(常設の領域がアプリ側で告げる。
      patterns/empty-results.md)。表の中の実物は「データ表示」の画面にある。
    </Text>
    <div class="pg-row">
      <code class="pg-tag">見出しだけ</code>
      <Card outlined>
        <EmptyState>
          {#snippet heading()}下書きはありません{/snippet}
        </EmptyState>
      </Card>
    </div>
    <div class="pg-row">
      <code class="pg-tag">全部</code>
      <Card outlined>
        <EmptyState>
          {#snippet media()}<Icon name="document" />{/snippet}
          {#snippet heading()}まだ請求書がありません{/snippet}
          {#snippet description()}最初の請求書を作ると、ここに一覧が出ます。下書きのまま置いておけます。{/snippet}
          {#snippet actions()}
            <Button size="sm">請求書を作る</Button>
            <Button size="sm" variant="text" color="plain">取り込み方を見る</Button>
          {/snippet}
        </EmptyState>
      </Card>
    </div>
  </section>

  <section>
    <Text as="h3" variant="title-lg">Stat(指標)</Text>
    <Text as="p" variant="body-sm" muted>
      値は整形済みの文字列で受け取る(桁も通貨もアプリの政策)。変化は向きだけを器が持ち、良し悪しは
      消費者が intent で渡す。増えたら悪い指標(解約率)があるので、器は向きから評価を導かない。変化の
      意味は文字が運び、印は装飾である。数字は字幅を揃えて並ぶ。
    </Text>
    <Grid min="12rem" gap="md">
      <Card outlined>
        <Stat trend="up" color="success">
          {#snippet label()}今月の売上{/snippet}
          {#snippet value()}1,284,000 円{/snippet}
          {#snippet support()}前月比 +12%{/snippet}
        </Stat>
      </Card>
      <Card outlined>
        <Stat trend="up" color="danger">
          {#snippet label()}解約率{/snippet}
          {#snippet value()}3.4 %{/snippet}
          {#snippet support()}前月比 +0.8pt{/snippet}
        </Stat>
      </Card>
      <Card outlined>
        <Stat trend="flat">
          {#snippet label()}平均応答時間{/snippet}
          {#snippet value()}128 ms{/snippet}
          {#snippet support()}前週から変わらず{/snippet}
        </Stat>
      </Card>
      <Card outlined>
        <Stat>
          {#snippet label()}登録済みの取引先{/snippet}
          {#snippet value()}1,024{/snippet}
        </Stat>
      </Card>
    </Grid>
  </section>
