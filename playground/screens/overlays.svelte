<script lang="ts">
  import { Button, IconButton, Stack, Cluster, Icon, Dialog, Drawer, Tooltip, Text } from '../../src/lib';

  let dlgLight = $state(false);
  let dlgExplicit = $state(false);
  let drawerOpen = $state(false);
  let drawerSide = $state<'inline-start' | 'inline-end' | 'block-start' | 'block-end'>('inline-end');
</script>

  <section>
    <Text as="h3" variant="title-lg">Dialog</Text>
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
    <Text as="h3" variant="title-lg">Drawer</Text>
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
    <Text as="h3" variant="title-lg">Tooltip</Text>
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
