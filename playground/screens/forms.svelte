<script lang="ts">
  import { IconButton, Box, Stack, Cluster, TextField, Select, Checkbox, Textarea, Switch, Icon, Radio, RadioGroup, Text, NumberField, PasswordField, OneTimeCodeField, FileField, DropArea, FilePreview } from '../../src/lib';

  let invite = $state('abc');
  let agree = $state(false);
  let agreeTouched = $state(false);
  let toppings = $state({ cheese: true, tomato: false });
  let bio = $state('');
  let query = $state('土鍋');
  let code = $state('');
  let recovery = $state('');
  let completed = $state('');
  // 添付は三つの部品の合成(patterns/file-upload.md)。値はアプリが持つ
  let attachments = $state<File[]>([]);
  let field: { accepted: (files: File[]) => void } | undefined = $state();
  // 大きさの書式はアプリの仕事である(FilePreview は文字を作らない。i18n.md §1)。
  // 1024 を超えるたびに単位を上げ、TB で止める(それ以上を扱う画面は無い)
  const sizeText = (n: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let v = n;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i += 1;
    }
    return `${i === 0 ? v : v.toFixed(1)} ${units[i]}`;
  };
  let notify = $state(true);
  let fEmail = $state('a@b.com');
  let fQuantity = $state<number | null>(2);
  let fWeight = $state<number | null>(null);
  let fPassword = $state('');
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
        {#snippet end()}<IconButton label="確かめる" variant="text" size="sm"><Icon name="check" /></IconButton>{/snippet}
      </TextField>
      <TextField bind:value={query} clearable clearLabel="消去" placeholder="注文を探す">
        {#snippet label()}検索(clearable){/snippet}
        {#snippet start()}<Icon name="search" />{/snippet}
        {#snippet description()}値があるときだけ消す操作が出る。Escape でも消える(RFC 0021){/snippet}
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
    <Text as="h3" variant="title-lg">NumberField(数の欄)</Text>
    <Text as="p" variant="body-sm" muted>
      打てる欄に数の意味論(spinbutton)を載せる。native の type=number は採らない(スピナーが指に小さく、
      ホイールで値が書き換わり、iOS で桁の扱いに難がある)。増減はタブ順から外し、矢印キーが同じことをする。
      上下で 1、PageUp / PageDown で 10 動く。Home と End は文字の移動に残す。書式は持たない。
    </Text>
    <Stack gap="md">
      <NumberField bind:value={fQuantity} min={0} max={99} incrementLabel="数量を一つ増やす" decrementLabel="数量を一つ減らす">
        {#snippet label()}数量(0〜99){/snippet}
        {#snippet description()}矢印キーでも動く。ホイールでは動かない{/snippet}
      </NumberField>
      <NumberField
        bind:value={fWeight}
        keyboard="decimal"
        step={0.5}
        min={0}
        size="sm"
        incrementLabel="重さを増やす"
        decrementLabel="重さを減らす"
      >
        {#snippet label()}重さ(kg。刻み 0.5){/snippet}
      </NumberField>
      <Text variant="body-sm" muted>いまの値: {fQuantity ?? '(空)'} / {fWeight ?? '(空)'}</Text>
      <!-- 名前を視覚から隠す(field.md §2)。隣の文が既に何の値かを語っているとき -->
      <Cluster gap="md" align="center">
        <Text variant="body-md">土鍋(かまど炊き)</Text>
        <NumberField
          bind:value={fQuantity}
          min={0}
          max={99}
          size="sm"
          labelHidden
          incrementLabel="数量を一つ増やす"
          decrementLabel="数量を一つ減らす"
        >
          {#snippet label()}土鍋(かまど炊き)の数量{/snippet}
        </NumberField>
      </Cluster>
    </Stack>
  </section>
  <section>
    <Text as="h3" variant="title-lg">PasswordField(秘匿の欄)</Text>
    <Text as="p" variant="body-sm" muted>
      切り替えは部品が必ず持つ(見せる手段が無いと、打ち間違いを直す手段が全部消して打ち直すことしか
      無くなる)。切り替えたことは隠れた文で知らせ、値そのものは読み上げに流さない(GOV.UK の裁定)。
      押された状態(aria-pressed)では伝えない。autocomplete は消費者が渡す。
    </Text>
    <Stack gap="md">
      <PasswordField
        bind:value={fPassword}
        autocomplete="new-password"
        showValueLabel="パスワードを表示する"
        hideValueLabel="パスワードを隠す"
        revealedMessage="パスワードを表示しました"
        hiddenMessage="パスワードを隠しました"
      >
        {#snippet label()}新しいパスワード{/snippet}
        {#snippet description()}12 文字以上。強さの判定はアプリの政策なので部品は持たない{/snippet}
      </PasswordField>
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
        <NumberField name="quantity" bind:value={fQuantity} min={0} incrementLabel="増やす" decrementLabel="減らす">
          {#snippet label()}数量(name=quantity){/snippet}
        </NumberField>
        <RadioGroup name="plan" required bind:value={fPlan}>
          {#snippet label()}プラン(name=plan, required){/snippet}
          <Radio value="free">{#snippet label()}無料{/snippet}</Radio>
          <Radio value="pro">{#snippet label()}Pro{/snippet}</Radio>
        </RadioGroup>
      </Stack>
    </form>
  </section>

  <section>
    <Text as="h3" variant="title-lg">OneTimeCodeField(確認コード)</Text>
    <Text as="p" variant="body-sm" muted>
      見えている枠は桁の数だけ並ぶが、打てる欄は一つである。貼り付けも SMS からの自動入力も一度で入り、
      読み上げには一つの値として届く。桁が揃ったら知らせる(何をするかはアプリが決める)。
    </Text>
    <Stack gap="lg">
      <OneTimeCodeField
        bind:value={code}
        autoReceive
        oncomplete={(v) => (completed = v)}
      >
        {#snippet label()}SMS に届いた 6 桁{/snippet}
        {#snippet description()}数字だけ。揃うと下に出る。autoReceive は Chromium で SMS を待ち受ける{/snippet}
      </OneTimeCodeField>
      <Text variant="body-sm" muted>揃った値: {completed || '(まだ)'}</Text>
      <OneTimeCodeField
        bind:value={recovery}
        length={8}
        charset="alphanumeric"
        masked
        showValueLabel="コードを表示する"
        hideValueLabel="コードを隠す"
        revealedMessage="コードを表示しました"
        hiddenMessage="コードを隠しました"
      >
        {#snippet label()}回復コード(英数字 8 桁・伏せ字){/snippet}
        {#snippet description()}伏せても見せ直せる。打ち間違いを直す手段を残す{/snippet}
      </OneTimeCodeField>
    </Stack>
  </section>

  <section>
    <Text as="h3" variant="title-lg">添付(FileField / DropArea / FilePreview)</Text>
    <Text as="p" variant="body-sm" muted>
      三つの部品の合成である。落とせる面の中に選ぶ欄を置き(落とすだけでは鍵盤の利用者に届かない)、
      選ばれたものは札で見せる。値はアプリが持ち、送信も進行も DS は持たない。
    </Text>
    <Stack gap="md">
      <!-- 絞り込みは値を持つ側(FileField)に任せる。面が先に弾くと、受け取った件数と弾いた件数が
           二度に分かれて告知が上書きされる(実物で分かった) -->
      <DropArea ondrop={(files) => field?.accepted(files)}>
        <div class="pg-drop">
          <FileField
          bind:this={field}
          bind:value={attachments}
          multiple
          accept={['image/*', 'application/pdf']}
          triggerLabel="ファイルを選ぶ"
          receivedLabel="{'{n}'} 件を受け取りました"
          rejectedLabel="{'{n}'} 件は受け取れません"
        >
            {#snippet label()}請求書{/snippet}
            {#snippet description()}画像か PDF。落とす・貼り付け・選ぶのどれでも入る{/snippet}
          </FileField>
        </div>
      </DropArea>
      {#each attachments as file, i (file.name + i)}
        <FilePreview
          fileName={file.name}
          meta={`${sizeText(file.size)}・${file.type || '種類不明'}`}
          removeLabel="添付を外す"
          onremove={() => (attachments = attachments.filter((_, j) => j !== i))}
        />
      {/each}
    </Stack>
  </section>
