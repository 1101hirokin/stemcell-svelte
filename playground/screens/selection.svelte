<script lang="ts">
  import { Slider, Stack, Cluster, Select, Radio, RadioGroup, Text, Rating } from '../../src/lib';

  // 評価(Rating)。読み取りは連続、入力は整数。段の名前は消費者が並びで渡す
  const starLabels = ['5 段階中 1', '5 段階中 2', '5 段階中 3', '5 段階中 4', '5 段階中 5'];
  let stars = $state<number | null>(3);

  let size = $state<string | undefined>(undefined);
  let sizeTouched = $state(false);
  let ship = $state('');
  let account = $state('personal');
  let volume = $state(40);
  let volumeCommitted = $state(40);
  // Slider の幾何の見比べ(SSOT は種の値。実機で見て確定する)
  const SLIDER_GEOMETRY = [
    { name: '実装のまま', track: null, thumb: null },
    { name: '細い', track: '0.125rem', thumb: '0.75rem' },
    { name: '種(4/16px)', track: '0.25rem', thumb: '1rem' },
    { name: '太い', track: '0.5rem', thumb: '1.25rem' },
    { name: 'M3 寄り', track: '1rem', thumb: '1.5rem' },
  ] as const;
  let sliderGeometry = $state('実装のまま');
  $effect(() => {
    const g = SLIDER_GEOMETRY.find((x) => x.name === sliderGeometry);
    const root = document.documentElement.style;
    if (!g || !g.track) {
      root.removeProperty('--slider-track-thickness');
      root.removeProperty('--slider-thumb-size');
      return;
    }
    root.setProperty('--slider-track-thickness', g.track);
    root.setProperty('--slider-thumb-size', g.thumb);
  });
</script>

{#snippet sliderLabel()}音量{/snippet}
{#snippet sliderDescription()}ドラッグ・クリック・矢印キーのどれでも動かせる{/snippet}
{#snippet sliderStepLabel()}音量(step=10){/snippet}
{#snippet sliderDisabledLabel()}音量(disabled){/snippet}

  <section>
    <Text as="h3" variant="title-lg">RadioGroup / Radio</Text>
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
    <Text as="h3" variant="title-lg">Select</Text>
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
    <Text as="h3" variant="title-lg">Slider</Text>
    <Text as="p" variant="body-sm" muted>
      範囲から値をひとつ位置で選ぶ。おおよその値で足りる場面のための部品で、正確な値が要るなら数値入力を
      併設する。native の input[type=range] を土台にしており、キーボード(矢印 / Home / End / PageUp /
      PageDown)とトラックのクリックが標準で効く(WCAG 2.5.7: ドラッグだけで操作できてはならない)。
    </Text>
    <Slider
      label={sliderLabel}
      description={sliderDescription}
      bind:value={volume}
      onchangeend={(v) => (volumeCommitted = v)}
    />
    <Text as="p" variant="body-sm" muted>
      逐次 change: {volume} / 確定 changeEnd: {volumeCommitted}
    </Text>
    <Slider label={sliderStepLabel} bind:value={volume} min={0} max={100} step={10} />
    <Slider label={sliderDisabledLabel} value={30} disabled />

    <Text as="p" variant="body-sm">幾何の見比べ: <code>{sliderGeometry}</code></Text>
    <Cluster gap="sm" align="center">
      {#each SLIDER_GEOMETRY as g (g.name)}
        <button
          type="button"
          class="pg-curve pg-scale"
          class:pg-curve-on={sliderGeometry === g.name}
          onclick={() => (sliderGeometry = g.name)}
        >
          {g.name}<br /><small>{g.track ? `${g.track} / ${g.thumb}` : 'SSOT の値'}</small>
        </button>
      {/each}
    </Cluster>
    <Text as="p" variant="body-sm" muted>
      トラックの太さとサムの径(SSOT は種の値)。進行表示のトークンは流用していない。Material 3 は
      進行表示のトラックを 4dp、Slider のトラックを 16dp と定めており、本 DS も溝の中立段を別に引いている。
      当たり判定は見た目の径と別で、サムを小さくしても 24px の下限を割らない(size.rules.json)。
    </Text>
  </section>

  <section>
    <Text as="h3" variant="title-lg">Rating(評価)</Text>
    <Text as="p" variant="body-sm" muted>
      読むだけの星は一つの絵として名前つきで届き(role=img)、付ける星は段の集合になる(native の radio)。
      平均点は連続で塗り、入力は整数だけを採る。撫でたときの予告は目で見える人にだけ出す。
      取り消しを許すときは鍵盤にも道を用意する(Delete と Backspace)。
    </Text>
    <div class="pg-row">
      <code class="pg-tag">読むだけ</code>
      <Rating readonly value={4.2} valueLabel="5 段階中 4.2(128 件の評価)">
        {#snippet label()}この商品の評価{/snippet}
      </Rating>
    </div>
    <div class="pg-row">
      <code class="pg-tag">付ける</code>
      <Stack gap="sm">
        <Rating bind:value={stars} itemLabels={starLabels} allowClear>
          {#snippet label()}あなたの評価{/snippet}
          {#snippet description()}矢印キーで動く。Delete か Backspace で取り消せる{/snippet}
        </Rating>
        <Text variant="body-sm" muted>いまの値: {stars ?? '(未評価)'}</Text>
      </Stack>
    </div>
    <div class="pg-row">
      <code class="pg-tag">10 段階</code>
      <Rating
        value={7}
        max={10}
        itemLabels={Array.from({ length: 10 }, (_, i) => `10 段階中 ${i + 1}`)}
      >
        {#snippet label()}満足度{/snippet}
      </Rating>
    </div>
  </section>
