<script lang="ts">
  import { Button, IconButton, Switcher, Box, Stack, Cluster, Grid, Sidebar, Icon, Card, Badge, Tag, Text, Center, Container, Cover, Frame, Reel, Imposter } from '../../src/lib';

  let threshold = $state('30rem');
  let gridMin = $state('16rem');
  let sidebarSide = $state<'start' | 'end'>('start');
</script>

  <section>
    <Text as="h3" variant="title-lg">Box</Text>
    <Text as="p" variant="body-sm" muted>内在スタイルの部品。inset は段(sm/md/lg)と大域の原始 X(8〜24)。1値で全周、2値「縦 横」で別指定。</Text>
    <Cluster gap="sm" align="center">
      {#each ['sm', 'md', 'lg', '12'] as inset (inset)}
        <div class="pg-outline">
          <Box {inset}><code>inset="{inset}"</code></Box>
        </div>
      {/each}
      <div class="pg-outline">
        <Box inset="sm lg"><code>inset="sm lg"</code></Box>
      </div>
      <div class="pg-outline">
        <Box inset="lg sm"><code>inset="lg sm"</code></Box>
      </div>
    </Cluster>
  </section>
  <section>
    <Text as="h3" variant="title-lg">Stack</Text>
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
    <Text as="h3" variant="title-lg">Cluster</Text>
    <Text as="p" variant="body-sm" muted>項目ごとに流れる折返し(全体の一斉切替は Switcher)。部品を狭めると行送りされる。</Text>
    <div class="pg-resizable">
      <Cluster gap="sm">
        {#each ['設計', 'トークン', '契約', '散文', '適合', '実測', 'レビュー', '裁定', '配信'] as t (t)}
          <div class="pg-chip">{t}</div>
        {/each}
      </Cluster>
    </div>
  </section>
  <section>
    <Text as="h3" variant="title-lg">Grid</Text>
    <Text as="p" variant="body-sm" muted>
      内在的な格子。列は min({gridMin})を下回らず、部品に応じて増減する
      (メディアクエリなし)。右下の掴みで部品をドラッグして確認する。
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
    <Text as="h3" variant="title-lg">Center / Container(幅の上限)</Text>
    <Text as="p" variant="body-sm" muted>
      同じ機構(論理方向の自動余白)で目的が違う二つ。Center は読める幅(既定 prose = 66ch)、Container は
      ページの殻(既定 xl)。段は container のトークンで rem 建てなので、読者が文字を拡大すると幅も一緒に
      広がる。破線は部品の輪郭を見せるための playground の飾り。
    </Text>
    <div class="pg-outline">
      <Center>
        <Text as="p" variant="body-md">
          測度の中に置かれた本文。部品がどれだけ広くても、行の長さはおよそ66文字で頭打ちになる。
          横いっぱいに広がろうとする既定(layout.md §2)の、唯一の明示的な例外がこれ。
          文字揃えは持たない: 中央に置くのは箱であって文字ではない。
        </Text>
      </Center>
    </div>
    <div class="pg-outline">
      <Center max="sm"><Text variant="body-sm">Center max=sm</Text></Center>
    </div>
    <div class="pg-outline">
      <Container max="md"><Text variant="body-sm">Container max=md(ページの殻。測度は持たない)</Text></Container>
    </div>
  </section>
  <section>
    <Text as="h3" variant="title-lg">Cover(1画面ぶんの骨格)</Text>
    <Text as="p" variant="body-sm" muted>
      部品の高さいっぱいに立ち、頭と足を端に残して主役を残りの空間の中央に置く。高さは 100dvh
      (動くブラウザ UI を勘定に入れた画面の高さ)で、非対応環境は 100vh に残る。下の枠は1画面ぶんの
      高さを持つので、枠の中がスクロールする。
    </Text>
    <div class="pg-scrollbox">
      <Cover>
        {#snippet header()}<Text variant="label-md">頭(上端に留まる)</Text>{/snippet}
        <Stack gap="md">
          <Text as="h3" variant="title-md">主役は中央</Text>
          <Text variant="body-sm">頭と足があってもなくても、残りの空間の中央に置かれる。</Text>
        </Stack>
        {#snippet footer()}<Text variant="label-md">足(下端に留まる)</Text>{/snippet}
      </Cover>
    </div>
  </section>
  <section>
    <Text as="h3" variant="title-lg">Sidebar</Text>
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
        <div class="pg-chip">本体。部品を狭めると縦積みへ折れ、DOM 順は変わらない。</div>
      </Sidebar>
    </div>
  </section>
  <section>
    <Text as="h3" variant="title-lg">Switcher</Text>
    <Text as="p" variant="body-sm" muted>
      右下の掴みで部品の幅をドラッグして切替を確認する。部品の幅が threshold
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
    <Text as="h3" variant="title-lg">Frame(比の窓)</Text>
    <Text as="p" variant="body-sm" muted>
      中身を指定した縦横比の枠に収め、はみ出しは枠が刈る。比は「横/縦」の整数比で、長さではなく形なので
      トークンの語彙の外にある。比でない値を渡すと警告して既定(16/9)へ退避する: 無効な値は
      aspect-ratio の宣言ごと無効にして、比の窓が無警告で消えるため。
    </Text>
    <Grid min="16rem" gap="md">
      <Stack gap="sm">
        <Text variant="label-md">16/9</Text>
        <Frame><div class="pg-fill">16/9</div></Frame>
      </Stack>
      <Stack gap="sm">
        <Text variant="label-md">1/1</Text>
        <Frame ratio="1/1"><div class="pg-fill">1/1</div></Frame>
      </Stack>
      <Stack gap="sm">
        <Text variant="label-md">4/3</Text>
        <Frame ratio="4/3"><div class="pg-fill">4/3</div></Frame>
      </Stack>
    </Grid>
  </section>
  <section>
    <Text as="h3" variant="title-lg">Reel(横に流す帯)</Text>
    <Text as="p" variant="body-sm" muted>
      あふれても折り返さず流れる(折り返すのは Cluster)。実際にあふれているときだけ焦点を受ける:
      Tab で帯に入って矢印キーでスクロールできる。収まっている帯は中身の無い停留所を作らないので
      Tab で素通りする。下の2つ目は部品に収まる帯で、こちらは焦点を受けない。
    </Text>
    <Reel>
      {#each ['契約', 'トークン', '適合検査', '門', '還流', '原始', '有機体', '層', '間隔', '曲率'] as word (word)}
        <Card><Stack gap="sm"><Text variant="title-sm">{word}</Text><Text variant="body-sm">帯の項目</Text></Stack></Card>
      {/each}
    </Reel>
    <Reel>
      <Tag>短い</Tag>
      <Tag>帯</Tag>
    </Reel>
  </section>
  <section>
    <Text as="h3" variant="title-lg">Imposter(下地の上への重ね)</Text>
    <Text as="p" variant="body-sm" muted>
      部品が下地と重ねの両方を持つ。基準を祖先に求めないので、周囲に transform や container-type が
      付いても重ねの位置は動かない。位置は論理の3×3(alignBlock × alignInline)。守らない・閉じない・
      奪わない: 下も支援技術から読め、覆っても意味は生まれない。Badge の anchor はこの原始の自己利用。
    </Text>
    <Grid min="12rem" gap="md">
      {#each [['start', 'start'], ['start', 'end'], ['center', 'center'], ['end', 'start'], ['end', 'end']] as [ab, ai] (ab + ai)}
        <Stack gap="sm">
          <Text variant="label-md">{ab} × {ai}</Text>
          <Imposter alignBlock={ab} alignInline={ai}>
            {#snippet base()}<Frame ratio="4/3"><div class="pg-fill">下地</div></Frame>{/snippet}
            <Tag color="danger">重ね</Tag>
          </Imposter>
        </Stack>
      {/each}
    </Grid>
    <Text as="p" variant="body-sm" muted>Badge の自己利用(行内モード + 隅):</Text>
    <Cluster gap="md">
      <Badge count={5}><IconButton label="通知"><Icon name="notification" /></IconButton></Badge>
      <Badge dot label="新着あり"><IconButton label="メッセージ"><Icon name="mail" /></IconButton></Badge>
    </Cluster>
  </section>
