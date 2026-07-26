<script lang="ts">
  import { IconButton, Box, Stack, Cluster, TextField, Select, Checkbox, Textarea, Switch, Icon, Radio, RadioGroup, Text } from '../../src/lib';

  let invite = $state('abc');
  let agree = $state(false);
  let agreeTouched = $state(false);
  let toppings = $state({ cheese: true, tomato: false });
  let bio = $state('');
  let notify = $state(true);
  let fEmail = $state('a@b.com');
  let fSubscribe = $state(true);
  let fNotify = $state(true);
  let fShip = $state('exp');
  let fPlan = $state('pro');
</script>

  <section>
    <Text as="h3" variant="title-lg">TextField</Text>
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
    <Text as="h3" variant="title-lg">Textarea</Text>
    <Text as="p" variant="body-sm" muted>複数行入力。TextField を継承(extends)し、start / end は持たない。縦リサイズ可。</Text>
    <Textarea bind:value={bio} rows={4} invalid={bio.length > 20}>
      {#snippet label()}自己紹介{/snippet}
      {#snippet description()}20字以内(現在 {bio.length}字){/snippet}
      {#snippet error()}長すぎる{/snippet}
    </Textarea>
  </section>
  <section>
    <Text as="h3" variant="title-lg">Checkbox</Text>
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
    <Text as="h3" variant="title-lg">Switch</Text>
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
    <Text as="h3" variant="title-lg">Form participation</Text>
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
