<script lang="ts">
  import {
    Button, Stack, Cluster, Dialog, Link, Text, ToolCall, Sources, Reasoning, Conversation, Message,
    Avatar, Textarea,
  } from '../../src/lib';

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

  // 会話の器と発話(Conversation / Message)。履歴はアプリが持つ(conversation §4)
  type Turn = { id: string; role: 'user' | 'assistant'; speaker: string; text: string; at: string };
  let turns = $state<Turn[]>([
    { id: 't1', role: 'user', speaker: 'あなた', text: '土鍋の発注点はいくつにすべき？', at: '12:03' },
    {
      id: 't2',
      role: 'assistant',
      speaker: 'アシスタント',
      text: '直近の出荷が1日あたり平均 2.1個、補充に7日かかるので、18個を目安にしています。',
      at: '12:04',
    },
  ]);
  // 人間同士のチャット。話者は全員 user で、自分と相手の別はアプリが持つ(role からは出てこない)
  const chat = [
    { id: 'c1', speaker: '佐藤', own: false, text: '土鍋の在庫、週末までもちそう？', at: '09:12' },
    { id: 'c2', speaker: 'あなた', own: true, text: '18個あるので大丈夫です', at: '09:13' },
    { id: 'c3', speaker: '鈴木', own: false, text: '追加の入荷は火曜でした', at: '09:15' },
  ];
  let generating = $state(false);
  let draft = $state('');
  const send = () => {
    const text = draft.trim();
    if (!text) return;
    turns = [...turns, { id: `u${turns.length}`, role: 'user', speaker: 'あなた', text, at: '12:05' }];
    draft = '';
    generating = true;
    setTimeout(() => {
      turns = [
        ...turns,
        {
          id: `a${turns.length}`,
          role: 'assistant',
          speaker: 'アシスタント',
          text: '（作り話の返答です）在庫の推移を見るかぎり、その前提で問題ありません。',
          at: '12:05',
        },
      ];
      generating = false;
    }, 1200);
  };
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

  <section>
    <Text as="h3" variant="title-lg">Conversation / Message(会話の器と発話)</Text>
    <Text as="p" variant="body-sm" muted>
      会話は「新しい情報が末尾にだけ足される、意味のある順序の記録」なので、器は log として届く。生成中は
      逐次で告知せず(streaming.md §4)、完了で一度届ける。末尾に居るときだけ追い、離れているあいだの新着は
      戻る手段とともに知らせる。発話の中身は器が解釈しない。姿は role から導かないので、ここでは助手を
      text(地に置く)、利用者を soft の行末側にしている。
    </Text>
    <div class="ai-conversation">
      <Conversation busy={generating} resumeLabel="新しい発話へ">
        {#snippet label()}アシスタントとの会話{/snippet}
        {#each turns as turn (turn.id)}
          <Message
            role={turn.role}
            speakerLabel={turn.speaker}
            variant={turn.role === 'user' ? 'soft' : 'text'}
            align={turn.role === 'user' ? 'end' : 'start'}
          >
            {#snippet speaker()}<Avatar name={turn.speaker} size="sm" decorative={turn.role === 'assistant'} />{/snippet}
            {#snippet meta()}{turn.at}{/snippet}
            {turn.text}
          </Message>
        {/each}
        {#if generating}
          <Message role="assistant" speakerLabel="アシスタント" variant="text">
            {#snippet speaker()}<Avatar name="アシスタント" size="sm" decorative />{/snippet}
            <Reasoning status="busy">
              {#snippet summary()}考えています{/snippet}
              在庫の推移を見ています。
            </Reasoning>
          </Message>
        {/if}
      </Conversation>
    </div>
    <Cluster gap="md" align="end">
      <Textarea bind:value={draft} rows={2} maxRows={4} placeholder="在庫について聞く">
        {#snippet label()}質問{/snippet}
      </Textarea>
      <Button onclick={send} disabled={generating}>送る</Button>
    </Cluster>
  </section>

  <section>
    <Text as="h3" variant="title-lg">人間同士のチャット(同じ器で)</Text>
    <Text as="p" variant="body-sm" muted>
      参加者が三人いれば発話は全部 user で、自分と相手の別も誰の発話かも role からは出てこない。誰かは
      speakerLabel が届け、姿は variant と color と align で選ぶ。ここでは自分の発話を primary の filled で
      行末側へ、相手の発話を soft の行頭側へ、参加の知らせを text の中央へ置いた。
    </Text>
    <div class="ai-conversation">
      <Conversation resumeLabel="新しい発話へ">
        {#snippet label()}台所の道具チーム{/snippet}
        <Message role="system" speakerLabel="お知らせ" variant="text" align="center">
          <Text variant="body-sm" muted>佐藤さんが参加しました</Text>
        </Message>
        {#each chat as line (line.id)}
          <Message
            role="user"
            speakerLabel={line.speaker}
            variant={line.own ? 'filled' : 'soft'}
            color={line.own ? 'primary' : 'plain'}
            align={line.own ? 'end' : 'start'}
          >
            {#snippet speaker()}<Avatar name={line.speaker} size="sm" />{/snippet}
            {#snippet meta()}{line.speaker}・{line.at}{/snippet}
            {line.text}
          </Message>
        {/each}
      </Conversation>
    </div>
  </section>
