<script lang="ts">
  import { Button, Stack, Cluster, Dialog, Link, Text, ToolCall, Sources, Reasoning } from '../../src/lib';

  let toolStatus = $state<'busy' | 'result' | 'error'>('busy');
  let reasoningStatus = $state<'busy' | 'complete'>('busy');
  let reasoningOpen = $state(false);
  // 生成中の名前は移り変わる(ChatGPT が段階ごとに文言を差し替えるのと同じ)。部品はその変化を
  // 描かれた文字から拾って、文字が貼り付いた立方体を上へ一面ぶん回す
  const REASONING_PHASES = ['考えています', '資料を読んでいます', '答えをまとめています'];
  let reasoningPhase = $state(0);
  $effect(() => {
    if (reasoningStatus !== 'busy') return;
    const id = setInterval(() => (reasoningPhase = (reasoningPhase + 1) % REASONING_PHASES.length), 2000);
    return () => clearInterval(id);
  });
  // 承認 pattern(patterns/approval.md)の実演。決定するまで実行は止まっている
  let approvalOpen = $state(false);
  let approvalResult = $state('(まだ決めていない)');
  const sourceItems = [
    { id: 'src-1', title: 'stemcell の憲法', url: 'https://example.com/constitution', excerpt: '三層(Normative / Expressive / Ceded)と七つの条。' },
    { id: 'src-2', title: 'source foundation', url: 'https://example.com/source', excerpt: '根拠への到達性と、引用と出典の相互参照。' },
  ];
</script>

  <section>
    <Text as="h3" variant="title-lg">ToolCall(ツール呼び出しの進行)</Text>
    <Text as="p" variant="body-sm" muted>
      1つの呼び出しが busy から result または error へ至る様を1枚で見せる。段階はアプリが所有する値で、
      UI は与えられた段階を描くだけ。実行中は領域が aria-busy で伝え、回る輪は装飾として支援技術から隠す。
      告知の割り込み度は段階に連動する: error は即時(role=alert)、result は穏当(role=status)。
    </Text>
    <div class="pg-controls">
      <label>
        status
        <select bind:value={toolStatus}>
          <option value="busy">busy</option>
          <option value="result">result</option>
          <option value="error">error</option>
        </select>
      </label>
    </div>
    <ToolCall status={toolStatus}>
      {#snippet name()}web_search{/snippet}
      {#snippet input()}<code>{'{ "query": "stemcell design system" }'}</code>{/snippet}
      {#snippet result()}
        <Stack gap="sm">
          <Text variant="body-sm">3件見つかりました。</Text>
          <Sources items={sourceItems}>
            {#snippet label()}出典{/snippet}
            {#snippet children(source)}
              <Link href={source.url}>{source.title}</Link>
            {/snippet}
          </Sources>
        </Stack>
      {/snippet}
      {#snippet error()}ネットワークに接続できません。時間をおいて試してください。{/snippet}
    </ToolCall>
  </section>
  <section>
    <Text as="h3" variant="title-lg">Reasoning(推論の経過)</Text>
    <Text as="p" variant="body-sm" muted>
      畳む機構は Disclosure の合成で、ここが足すのは生成の進行の到達性と、推論が回答でなく補助であるという扱い。
      既定は畳んだ状態。完了が支援技術へ届く経路は名前で、段階を語る名前が変わったことを一度だけ告げる
      (DS は「考え終わりました」のような文言を持たない)。UI は勝手に畳まない: 完了で畳みたいアプリが status を
      見て open を落とす。生成中は名前が2秒ごとに移り変わる: 部品は描かれた文字の変化を拾い、文字が貼り付いた立方体を
      上へ一面ぶん回す。
    </Text>
    <div class="pg-controls">
      <label>
        status
        <select bind:value={reasoningStatus}>
          <option value="busy">busy</option>
          <option value="complete">complete</option>
        </select>
      </label>
    </div>
    <Reasoning status={reasoningStatus} bind:open={reasoningOpen}>
      {#snippet summary()}{reasoningStatus === 'busy' ? REASONING_PHASES[reasoningPhase] : '3秒考えました'}{/snippet}
      <p>まず利用者が何を尋ねているかを確かめる。</p>
      <p>次に、手元の出典で答えられるかを見る。足りなければ検索する。</p>
      <p>最後に、答えの形(箇条書きか文章か)を選ぶ。</p>
    </Reasoning>
    <Text as="p" variant="body-sm" muted>open: {reasoningOpen}</Text>
  </section>
  <section>
    <Text as="h3" variant="title-lg">Sources(回答の根拠)</Text>
    <Text as="p" variant="body-sm" muted>
      出典の集合を一枚に集める。器が縛るのは到達性と相互参照だけで、項目の中身(到達手段の Link、題や
      抜粋の Text)はアプリが組む。相互参照キーは UI が採番せず出典が持つ値を使い、各項目がその id を帯びる
      (下の項目は id="src-1" のように付いていて、本文中の引用から断片リンクで指せる)。
    </Text>
    <Sources items={sourceItems}>
      {#snippet label()}参照した情報源{/snippet}
      {#snippet children(source)}
        <Stack gap="sm">
          <Link href={source.url}>{source.title}</Link>
          <Text variant="body-sm" muted>{source.excerpt}</Text>
        </Stack>
      {/snippet}
    </Sources>
  </section>
  <section>
    <Text as="h3" variant="title-lg">承認(pattern。部品ではない)</Text>
    <Text as="p" variant="body-sm" muted>
      不可逆な操作の前で実行が止まり、人間の承認か却下を待つ。新しい部品は作らず、Dialog(dismiss は explicit)と
      Button の合成で組む。背景クリックや Escape では閉じない: 偶然の操作で問いが消えると、承認したのか却下したのか
      分からなくなる。却下のボタンが明示の退出路になる。閉じた後、焦点は開いたボタンへ戻る。
    </Text>
    <Cluster gap="md" align="center">
      <Button onclick={() => (approvalOpen = true)}>ファイルを削除する</Button>
      <Text variant="body-sm" muted>決定: {approvalResult}</Text>
    </Cluster>
    <Dialog bind:open={approvalOpen} dismiss="explicit">
      {#snippet title()}この操作を実行しますか{/snippet}
      {#snippet content()}
        <Stack gap="md">
          <Text variant="body-md">エージェントが次のツールを呼び出そうとしています。</Text>
          <ToolCall status="busy">
            {#snippet name()}delete_file{/snippet}
            {#snippet input()}<code>{'{ "path": "/reports/2026-07.csv" }'}</code>{/snippet}
          </ToolCall>
        </Stack>
      {/snippet}
      {#snippet actions()}
        <Button variant="outlined" color="plain" onclick={() => { approvalResult = '却下'; approvalOpen = false; }}>
          却下する
        </Button>
        <Button color="danger" onclick={() => { approvalResult = '承認'; approvalOpen = false; }}>
          削除を承認する
        </Button>
      {/snippet}
    </Dialog>
  </section>
