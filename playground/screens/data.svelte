<script lang="ts">
  import { Disclosure, Cluster, Card, Tag, Text, List, Accordion, DateField, Calendar, DatePicker, DateRangePicker } from '../../src/lib';

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
