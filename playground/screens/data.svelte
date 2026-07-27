<script lang="ts">
  import { Disclosure, Cluster, Card, Tag, Text, List, Accordion, DateField, Calendar, DatePicker, DateRangePicker, Table, Select, Menu, Icon, RadioGroup, Radio, Stack, EmptyState, TextField, Button, TimeField } from '../../src/lib';
  import type { TableColumn, TableSort } from '../../src/lib';

  let faqOpen = $state(false);
  const LIST_ITEMS = [
    { id: 'l1', name: '土鍋(三合炊き)', note: '在庫あり' },
    { id: 'l2', name: '木のまな板', note: '残り2点' },
    { id: 'l3', name: '鉄のフライパン', note: '取り寄せ' },
  ];
  let listDivided = $state(true);
  let accordionOpen = $state<string[]>(['faq1']);
  let accordionExclusive = $state(false);
  const ACCORDION_ITEMS = [
    { id: 'faq1', label: '配送について' },
    { id: 'faq2', label: '返品について' },
    { id: 'faq3', label: '法人向け(準備中)', disabled: true },
  ];

  // 日付(クラスタ10 第3段)。値はアプリが持つ。暦日であって時刻もタイムゾーンも持たない
  let due = $state('2026-07-20');
  let calendarMonth = $state('2026-07');
  let picked = $state('2026-07-20');
  let range = $state({ start: '2026-07-20', end: '2026-07-26' });

  // Table(クラスタ10 第2段)。並べ替えも選択も値で、器は要求を返すだけ
  const orders = [
    { id: 'o-1041', customer: '朝日商会', status: '発送済み', amount: 128000, date: '2026-07-20' },
    { id: 'o-1042', customer: '向日葵デザイン', status: '準備中', amount: 42800, date: '2026-07-21' },
    { id: 'o-1043', customer: '南風製作所', status: '準備中', amount: 9800, date: '2026-07-23' },
    { id: 'o-1044', customer: '北斗印刷', status: '取消', amount: 0, date: '2026-07-24' },
  ];
  const orderColumns: TableColumn[] = [
    { id: 'id', sortable: true },
    { id: 'customer' },
    { id: 'status' },
    { id: 'date', sortable: true },
    { id: 'amount', align: 'end', sortable: true },
    { id: 'actions', align: 'end' },
  ];
  const columnLabel: Record<string, string> = {
    id: '注文番号',
    customer: '取引先',
    status: '状態',
    date: '注文日',
    amount: '金額',
    actions: '操作',
  };
  let sort = $state<TableSort | undefined>({ column: 'date', direction: 'descending' });
  let selectedOrders = $state<string[]>(['o-1042']);
  let activated = $state('(まだ)');
  let overflow = $state<'scroll' | 'wrap'>('scroll');
  let sticky = $state<'none' | 'start' | 'end' | 'both'>('both');
  // 並べ替えはアプリがやる(器は要求を返すだけ)
  // 空状態と告知(patterns/empty-results.md)。0 件は常設の領域が件数で告げ、空状態の器は告知しない
  let keyword = $state('');
  let startTime = $state('09:00');
  let endTime = $state('18:30');
  let mark = $state('');
  const filteredOrders = $derived(
    keyword.trim() ? orders.filter((o) => o.customer.includes(keyword.trim())) : orders,
  );
  const sortedOrders = $derived.by(() => {
    if (!sort) return filteredOrders;
    const dir = sort.direction === 'ascending' ? 1 : -1;
    return [...filteredOrders].sort((a, b) => {
      const x = a[sort!.column as 'id'];
      const y = b[sort!.column as 'id'];
      return (x < y ? -1 : x > y ? 1 : 0) * dir;
    });
  });

  // 期間の候補(patterns/date-range.md)。候補の中身も「いまどれか」もアプリが持つ。器は日付を比べない
  const dayMs = 86_400_000;
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const back = (days: number) => {
    const now = new Date();
    return { start: iso(new Date(now.getTime() - days * dayMs)), end: iso(now) };
  };
  const rangePresets = [
    { value: 'today', label: '今日', of: () => back(0) },
    { value: '7d', label: '過去7日間', of: () => back(6) },
    { value: '30d', label: '過去30日間', of: () => back(29) },
    { value: '90d', label: '過去90日間', of: () => back(89) },
  ];
  let preset = $state('7d');
  let presetRange = $state(rangePresets[1]!.of());
  const applyPreset = (v: string) => {
    preset = v;
    presetRange = rangePresets.find((p) => p.value === v)!.of();
  };

  // 候補が多いとき(10 を超える)は Select へ畳む(patterns/date-range.md §3)。実物で確かめる
  const manyPresets = [
    ['today', '今日'], ['yesterday', '昨日'], ['7d', '過去7日間'], ['14d', '過去14日間'],
    ['30d', '過去30日間'], ['60d', '過去60日間'], ['90d', '過去90日間'], ['mtd', '今月'],
    ['lastMonth', '先月'], ['qtd', '今四半期'], ['ytd', '今年'], ['lastYear', '昨年'],
  ].map(([value, label]) => ({ value: value!, label: label! }));
  const manyDays: Record<string, number> = {
    today: 0, yesterday: 1, '7d': 6, '14d': 13, '30d': 29, '60d': 59, '90d': 89,
    mtd: 20, lastMonth: 50, qtd: 80, ytd: 200, lastYear: 400,
  };
  let manyPreset = $state('30d');
  let manyRange = $state(back(29));
  const applyMany = (v: string) => {
    manyPreset = v;
    manyRange = back(manyDays[v] ?? 0);
  };
</script>

{#snippet faqSummary()}配送について{/snippet}
{#snippet faqContent()}<p>注文から3営業日で発送します。地域により前後します。</p>{/snippet}
{#snippet faqSummary2()}返品について{/snippet}
{#snippet faqContent2()}<p>到着から14日以内であれば返品できます。</p>{/snippet}

  <section>
    <Text as="h3" variant="title-lg">List / Accordion(クラスタ10 第1段)</Text>
    <Text as="p" variant="body-sm" muted>
      List は項目の並びで、選択は持たない(選ぶ場面は RadioGroup / Menu / Tabs が埋めている)。項目の器は List が
      持ち、区切りは口で選ぶ。Accordion は Disclosure の束で、開いている集合をアプリが持つ。排他の口は無く、
      1つに保ちたいアプリは受け取った集合を絞る(下の切替で試せる)。
    </Text>

    <label class="pg-field">
      <input type="checkbox" bind:checked={listDivided} />区切りを引く(divided)
    </label>
    <Card outlined>
      <List items={LIST_ITEMS} divided={listDivided}>
        {#snippet children(item)}
          <Cluster gap="md" align="center">
            <Text variant="body-md">{item.name}</Text>
            <Tag size="sm">{item.note}</Tag>
          </Cluster>
        {/snippet}
      </List>
    </Card>

    <label class="pg-field">
      <input type="checkbox" bind:checked={accordionExclusive} />1つだけ開く(アプリ側で集合を絞る)
    </label>
    <Card outlined>
      <Accordion
        items={ACCORDION_ITEMS}
        open={accordionOpen}
        onopenchange={(next) => (accordionOpen = accordionExclusive ? next.slice(-1) : next)}
      >
        {#snippet panel(id)}
          <Text variant="body-sm">
            {id === 'faq1' ? '注文から3営業日で発送します。' : '到着から14日以内であれば返品できます。'}
          </Text>
        {/snippet}
      </Accordion>
    </Card>
    <Text as="p" variant="body-sm" muted>開いている集合: [{accordionOpen.join(', ')}]</Text>
  </section>
  <section>
    <Text as="h3" variant="title-lg">Disclosure</Text>
    <Text as="p" variant="body-sm" muted>
      要約の下に内容を畳む単体の開示。native の details / summary を土台にしており、開閉・button の
      意味論・aria-expanded・畳んだ内容の非到達は標準が満たす。open はアプリが持つ値で、押すと
      openchange の要求だけが出る(UI が勝手に確定しない)。複数を排他に開く形(Accordion)は別部品。
    </Text>
    <Disclosure summary={faqSummary} content={faqContent} bind:open={faqOpen} />
    <Disclosure summary={faqSummary2} content={faqContent2} />
    <Text as="p" variant="body-sm" muted>1つ目の open: {faqOpen}</Text>
  </section>

  <section>
    <Text as="h3" variant="title-lg">DateField(桁で打つ欄)</Text>
    <Text as="p" variant="body-sm" muted>
      年・月・日を桁に分けて受ける。並びも桁の名前も週の始まりも環境から借りるので、DS は文言を持たない。
      上下でその桁を増減し、左右で桁を移る(native の input[type=date] と同じ手触り)。値が日として成立した
      ときにだけ change が出る: 年だけ入った状態は日ではない。
    </Text>
    <DateField bind:value={due} min="2026-01-01" max="2026-12-31">
      {#snippet label()}納品日{/snippet}
      {#snippet description()}2026年のうちで選ぶ{/snippet}
    </DateField>
    <Text variant="body-sm" muted>値: {due || '(未入力)'}</Text>
  </section>

  <section>
    <Text as="h3" variant="title-lg">Calendar(月の格子)</Text>
    <Text as="p" variant="body-sm" muted>
      選択の意味を持たない。今どこが選ばれているかを受け取り、押された日を返すだけで、意味づけは束ねる側が
      与える。矢印で日、上下で週、Page で月、Shift+Page で年。移動は選択ではないので Enter で選ぶ。
      今日には aria-current="date" が立つ。
    </Text>
    <Card outlined>
      <Calendar bind:month={calendarMonth} start={picked} onselect={(d) => (picked = d)} />
    </Card>
    <Text variant="body-sm" muted>押された日: {picked} / 表示している月: {calendarMonth}</Text>
  </section>

  <section>
    <Text as="h3" variant="title-lg">DatePicker(欄 + 暦)</Text>
    <Text as="p" variant="body-sm" muted>
      打っても選んでもよい。両者は同じ値を指す。暦が開いているかは器が内部で持つ(トリガーに従属する一時面
      なので、値ではない)。暦を開かずキーボードだけで入れられることが要求である。
    </Text>
    <DatePicker bind:value={picked} calendarLabel="暦を開く">
      {#snippet label()}公開日{/snippet}
    </DatePicker>
    <Text variant="body-sm" muted>値: {picked || '(未入力)'}</Text>
  </section>

  <section>
    <Text as="h3" variant="title-lg">DateRangePicker(期間)</Text>
    <Text as="p" variant="body-sm" muted>
      始まりと終わりで1つの期間。片方だけ変わったときも対で知らせる。暦は2ヶ月ぶん並べ、1回目の押下で
      始まり、2回目で終わりになる(逆順に押したら対を入れ替える)。プリセット(「過去7日間」等)は持たない:
      何を候補に出すかはアプリの政策で、組み方は pattern が示す。
    </Text>
    <DateRangePicker
      start={range.start}
      end={range.end}
      calendarLabel="暦を開く"
      onchange={(next) => (range = next)}
    >
      {#snippet label()}対象の期間{/snippet}
      {#snippet startLabel()}開始日{/snippet}
      {#snippet endLabel()}終了日{/snippet}
    </DateRangePicker>
    <Text variant="body-sm" muted>期間: {range.start || '(未定)'} 〜 {range.end || '(未定)'}</Text>
  </section>

  <section>
    <Text as="h3" variant="title-lg">TimeField(時刻の欄)</Text>
    <Text as="p" variant="body-sm" muted>
      桁で受けるのは DateField と同型で、手触り(増減・打ち込み・送り)は共有の道具が持つ。値は常に
      24 時間の表記(HH:mm)で、表示が 12 時間制でも変わらない。時間の刻みは既定で環境から借り、
      消費者が上書きできる。刻み(15 分単位)は持たない。
    </Text>
    <Cluster gap="lg" align="start">
      <TimeField bind:value={startTime} segmentLabels={{ hour: '時', minute: '分' }}>
        {#snippet label()}開始時刻(環境の刻み){/snippet}
      </TimeField>
      <TimeField bind:value={endTime} hourCycle="12" segmentLabels={{ hour: '時', minute: '分', dayPeriod: '午前・午後' }}>
        {#snippet label()}終了時刻(12 時間制){/snippet}
      </TimeField>
      <TimeField
        bind:value={mark}
        hourCycle="24"
        seconds
        segmentLabels={{ hour: '時', minute: '分', second: '秒' }}
      >
        {#snippet label()}記録の位置(秒あり){/snippet}
      </TimeField>
    </Cluster>
    <Text variant="body-sm" muted>いまの値: {startTime || '(空)'} / {endTime || '(空)'} / {mark || '(空)'}</Text>
  </section>
  <section>
    <Text as="h3" variant="title-lg">Table(クラスタ10 第2段)</Text>
    <Text as="p" variant="body-sm" muted>
      行と列に意味がある表。並べ替えも選択も値で、器は要求を返すだけ(並べ替えるのはアプリ)。セルは焦点を
      受けない(表であって grid ではない)。行はどこを押しても一次の行き先へ進むが、行の中の操作を押した
      ときは起こらない。狭いときは横へ送り、端の列を貼り付けられる。
    </Text>
    <Cluster>
      <Select
        value={overflow}
        options={[
          { value: 'scroll', label: 'scroll(1行に収めて送る)' },
          { value: 'wrap', label: 'wrap(折り返す)' },
        ]}
        onchange={(v) => (overflow = v as typeof overflow)}
      >
        {#snippet label()}収まらない中身{/snippet}
      </Select>
      <Select
        value={sticky}
        options={[
          { value: 'none', label: 'none' },
          { value: 'start', label: 'start(先頭列)' },
          { value: 'end', label: 'end(末尾列)' },
          { value: 'both', label: 'both' },
        ]}
        onchange={(v) => (sticky = v as typeof sticky)}
      >
        {#snippet label()}貼り付ける列{/snippet}
      </Select>
    </Cluster>
    <Cluster gap="md" align="end">
      <TextField bind:value={keyword} placeholder="取引先で絞る">
        {#snippet label()}取引先{/snippet}
      </TextField>
      <!-- 件数の領域は最初から居て、中身だけ差し替える(後から現れる領域は拾われない。
           patterns/empty-results.md §2)。空状態の器は告知しない -->
      <Text variant="body-sm" muted>
        <span role="status">{sortedOrders.length ? `${sortedOrders.length} 件` : '該当なし'}</span>
      </Text>
    </Cluster>
    <Table
      columns={orderColumns}
      rows={sortedOrders}
      {sort}
      {overflow}
      {sticky}
      selected={selectedOrders}
      rowLabel={(row) => `${row.customer}の注文`}
      selectionLabel="すべての注文"
      onsortchange={(next) => (sort = next ?? undefined)}
      onselectedchange={(next) => (selectedOrders = next)}
      onrowactivate={(id) => (activated = id)}
    >
      {#snippet caption()}直近の注文{/snippet}
      {#snippet header(column)}{columnLabel[column.id]}{/snippet}
      {#snippet cell(row, column)}
        {#if column.id === 'actions'}
          <Menu
            size="sm"
            placement="block-end"
            items={[
              { id: 'detail', label: '詳細を見る', icon: 'search' },
              { id: 'duplicate', label: '複製', icon: 'clipboard' },
              { id: 'invoice', label: '請求書を送る', icon: 'share', description: '取引先へメールで送る' },
              { id: 'cancel', label: '取消', icon: 'delete', disabled: row.status === '取消' },
            ]}
            onselect={(id) => (activated = `${row.id} / ${id}`)}
          >
            {#snippet trigger()}<Icon name="dots.horizontal" label="この注文の操作" />{/snippet}
          </Menu>
        {:else if column.id === 'amount'}
          {row.amount.toLocaleString('ja-JP')} 円
        {:else if column.id === 'status'}
          <Tag>{row.status}</Tag>
        {:else}
          {row[column.id]}
        {/if}
      {/snippet}
      {#snippet empty()}
        <EmptyState>
          {#snippet media()}<Icon name="search" />{/snippet}
          {#snippet heading()}「{keyword}」に一致する注文はありません{/snippet}
          {#snippet description()}取引先の名前の一部で探せます。条件を戻すと全部の注文が出ます。{/snippet}
          {#snippet actions()}
            <Button size="sm" variant="outlined" color="plain" onclick={() => (keyword = '')}>条件を戻す</Button>
          {/snippet}
        </EmptyState>
      {/snippet}
    </Table>
    <Text variant="body-sm" muted>
      選んだ行: {selectedOrders.join(', ') || '(なし)'} / 押された行: {activated} /
      並べ替え: {sort ? `${sort.column} ${sort.direction}` : '(なし)'}
    </Text>
  </section>

  <section>
    <Text as="h3" variant="title-lg">期間の候補(pattern の実物確認)</Text>
    <Text as="p" variant="body-sm" muted>
      「過去7日間」のような候補を期間の選択に添える形(patterns/date-range.md)。候補は値の選択なので
      RadioGroup で組み、いまどれが選ばれているかはアプリが持つ(器は日付を比べない)。暦や欄で直に変えたら
      どの候補も選ばれていない状態にする。候補は暦の面の先頭へ差し込む。
    </Text>
    <DateRangePicker
      start={presetRange.start}
      end={presetRange.end}
      calendarLabel="暦を開く"
      onchange={(next) => {
        presetRange = next;
        preset = ''; // 直に変えたら候補の選択は外れる(pattern §2)
      }}
    >
      {#snippet label()}対象の期間{/snippet}
      {#snippet startLabel()}開始日{/snippet}
      {#snippet endLabel()}終了日{/snippet}
      {#snippet panelLead()}
        <Stack gap="sm">
          <RadioGroup name="range-preset" value={preset} onchange={(v) => applyPreset(v)}>
            {#snippet label()}期間の候補{/snippet}
            {#each rangePresets as p (p.value)}
              <Radio value={p.value}>
                {#snippet label()}{p.label}{/snippet}
              </Radio>
            {/each}
          </RadioGroup>
        </Stack>
      {/snippet}
    </DateRangePicker>
    <Text variant="body-sm" muted>
      候補: {preset || '(選ばれていない)'} / 期間: {presetRange.start} 〜 {presetRange.end}
    </Text>
  </section>

  <section>
    <Text as="h3" variant="title-lg">候補が多いとき(pattern §3 の確認)</Text>
    <Text as="p" variant="body-sm" muted>
      候補が10を超えたら Select へ畳んでよい、という指針の実物確認。選択の意味論は同じ(値の選択)で、
      見せ方だけが変わる。面の中に畳んだ選択を置くので、面の中で面が開く形になる。
    </Text>
    <DateRangePicker
      start={manyRange.start}
      end={manyRange.end}
      calendarLabel="暦を開く"
      onchange={(next) => {
        manyRange = next;
        manyPreset = '';
      }}
    >
      {#snippet label()}対象の期間(候補12件){/snippet}
      {#snippet startLabel()}開始日{/snippet}
      {#snippet endLabel()}終了日{/snippet}
      {#snippet panelLead()}
        <Select
          value={manyPreset}
          options={manyPresets}
          placeholder="候補から選ぶ"
          onchange={(v) => applyMany(v)}
        >
          {#snippet label()}期間の候補{/snippet}
        </Select>
      {/snippet}
    </DateRangePicker>
    <Text variant="body-sm" muted>
      候補: {manyPreset || '(選ばれていない)'} / 期間: {manyRange.start} 〜 {manyRange.end}
    </Text>
  </section>
