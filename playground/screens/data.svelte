<script lang="ts">
  import { Disclosure, Cluster, Card, Tag, Text, List, Accordion } from '../../src/lib';

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
