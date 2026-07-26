<script lang="ts">
  import { Button, Stack, Cluster, Grid, Card, Link, Alert, Text } from '../../src/lib';

  let alertShown = $state(true);
  let alertLive = $state(false);
</script>

  <section>
    <Text as="h3" variant="title-lg">Card</Text>
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
    <Text as="h3" variant="title-lg">Alert</Text>
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
