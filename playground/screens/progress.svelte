<script lang="ts">
  import { LinearProgress, CircularProgress, LinearLoader, CircularLoader, Stack, Cluster, Skeleton, Text } from '../../src/lib';

  let progressValue = $state(40);
</script>

  <section>
    <Text as="h3" variant="title-lg">進行表示(4部品)</Text>
    <Text as="p" variant="body-sm" muted>
      終わりの割合が分かるなら Progress、分からない待ちなら Loader。円形と線形で4本になる。値は
      showValue と無関係に常に支援技術へ届く(第1条)。可視の数字は既定で出さない(第3条の抑制)。
    </Text>

    <label class="pg-field">
      value({progressValue})
      <input type="range" min="0" max="100" bind:value={progressValue} />
    </label>

    <div class="pg-row">
      <code class="pg-tag">確定・線形</code>
      <Stack gap="md">
        <LinearProgress label="アップロード" value={progressValue} />
        <LinearProgress label="アップロード(数字あり)" value={progressValue} showValue />
      </Stack>
    </div>
    <div class="pg-row">
      <code class="pg-tag">確定・円形</code>
      <Cluster gap="lg" align="center">
        <CircularProgress label="書き出し sm" value={progressValue} size="sm" />
        <CircularProgress label="書き出し md" value={progressValue} />
        <CircularProgress label="書き出し lg" value={progressValue} size="lg" />
        <CircularProgress label="書き出し(数字あり)" value={progressValue} size="lg" showValue />
      </Cluster>
    </div>
    <div class="pg-row">
      <code class="pg-tag">不確定・線形</code>
      <LinearLoader label="検索中" />
    </div>
    <div class="pg-row">
      <code class="pg-tag">不確定・円形</code>
      <Cluster gap="lg" align="center">
        <CircularLoader label="読み込み中 sm" size="sm" />
        <CircularLoader label="読み込み中 md" />
        <CircularLoader label="読み込み中 lg" size="lg" />
      </Cluster>
    </div>
    <Text as="p" variant="body-sm" muted>
      reduced-motion(OS の「視差効果を減らす」等)を入れると、Loader の2本は止まらず低速へ沈静する
      (裁定。止めると見る人に待ちが伝わらないため)。Progress の2本は値の補間だけが瞬時になり、
      値そのものは常に正しい。
    </Text>
  </section>
  <section>
    <Text as="h3" variant="title-lg">Skeleton</Text>
    <Text as="p" variant="body-sm" muted>読み込み中の代役。text=文字行 / box=面 / circle=円。寸法は親か font に従う。reduced-motion で shimmer 停止。</Text>
    <Cluster gap="md">
      <div style="inline-size: 3rem; block-size: 3rem;"><Skeleton kind="circle" /></div>
      <Stack gap="sm">
        <div style="inline-size: 14rem;"><Skeleton kind="text" /></div>
        <div style="inline-size: 10rem;"><Skeleton kind="text" /></div>
      </Stack>
    </Cluster>
    <div style="inline-size: 14rem; block-size: 6rem;"><Skeleton kind="box" /></div>
  </section>
