<script lang="ts">
  import { Button, Box, Cluster, Icon, Menu, Text, Tabs, Breadcrumb, Pagination, NavList } from '../../src/lib';

  let lastAction = $state('(なし)');
  let tab = $state('overview');
  const TAB_ITEMS = [
    { id: 'overview', label: '概要' },
    { id: 'activity', label: '活動', icon: 'chat' },
    { id: 'files', label: '書類', disabled: true },
    { id: 'deals', label: '取引' },
  ];
  let navCurrent = $state('customers');
  const NAV_ITEMS = [
    { id: 'home', label: 'ホーム', href: '#nav-home', icon: 'home' },
    { id: 'customers', label: '顧客', href: '#nav-customers', icon: 'user.group' },
    { id: 'orders', label: '注文', href: '#nav-orders', icon: 'shop.cart' },
    { id: 'admin', label: '管理(権限なし)', href: '#nav-admin', icon: 'setting', disabled: true },
  ];
  let page = $state(3);
</script>

  <section>
    <Text as="h3" variant="title-lg">ナビゲーション(Tabs / Breadcrumb / Pagination / NavList)</Text>
    <Text as="p" variant="body-sm" muted>
      クラスタ9。Tabs は矢印で移動すると選択も動く(移動 = 選択。disabled は飛ばし、RTL では左右が反転する)。
      Breadcrumb は最後が現在地でリンクにしない。Pagination は中央が現在地の表示であると同時に行き先の選択で、
      番号を並べずに任意の頁へ飛べる(欄の名前は部品が文脈を語っているので視覚から隠している)。NavList は現在地を
      aria-current で届ける(色だけに頼らない)。上の density を compact にすると、どれも間隔が詰まって当たり判定の
      床(24px)だけが残る。
    </Text>

    <Breadcrumb items={[{ label: 'ホーム', href: '#' }, { label: '顧客', href: '#' }, { label: '青葉製作所' }]}>
      {#snippet label()}現在地{/snippet}
    </Breadcrumb>

    <Tabs bind:value={tab} items={TAB_ITEMS}>
      {#snippet panel(id)}
        <Box inset="md">
          <Text variant="body-md">{id} の面。選ばれているタブのぶんだけを描くので、他の面は支援技術からも到達しない。</Text>
        </Box>
      {/snippet}
    </Tabs>

    <Pagination bind:page pages={12}>
      {#snippet previous()}前へ{/snippet}
      {#snippet next()}次へ{/snippet}
      {#snippet label()}ページ送り{/snippet}
    </Pagination>

    <div class="pg-nav">
      <NavList items={NAV_ITEMS} current={navCurrent}>
        {#snippet label()}画面{/snippet}
      </NavList>
    </div>
    <Cluster gap="sm">
      {#each NAV_ITEMS.filter((i) => !i.disabled) as item (item.id)}
        <Button variant="text" color="plain" size="sm" onclick={() => (navCurrent = item.id)}>
          {item.label}へ移る
        </Button>
      {/each}
    </Cluster>
  </section>
  <section>
    <Text as="h3" variant="title-lg">Menu</Text>
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
