<script lang="ts">
  // 触点の切り分け用。鍵盤が出たときに、どの層で「欄が鍵盤の上まで運ばれる」が失われるかを見る。
  // 部品の見本ではないので、片が付いたらこの画面ごと落とす。
  import { Combobox, Stack, Text, TextField } from '../../src/lib';

  const options = [
    { value: 'a', label: '朝日商会' },
    { value: 'b', label: '向日葵デザイン' },
    { value: 'c', label: '南風製作所' },
  ];
  let value = $state('');
  let query = $state('');
  const filtered = $derived(query.trim() ? options.filter((o) => o.label.includes(query.trim())) : options);
</script>

<Stack gap="lg">
  <Text as="h2" variant="display-sm">鍵盤の上まで運ばれるか(切り分け)</Text>
  <Text as="p" variant="body-sm" muted>
    下まで送って、下の三つを順に押す。運ばれる欄と運ばれない欄の境目が、原因のある層である。素の欄が運ばれて
    TextField が運ばれないなら DS の欄の作り、TextField が運ばれて Combobox が運ばれないなら面の開き方。
  </Text>

  <div style="block-size: 120vh"></div>

  <Stack gap="lg">
    <label>
      <Text variant="label-md">1 素の欄(DS を通さない)</Text>
      <input
        type="text"
        placeholder="押す"
        style="inline-size:100%;box-sizing:border-box;font-size:16px;padding:12px;border:1px solid #999;border-radius:8px"
      />
    </label>

    <TextField placeholder="押す">
      {#snippet label()}2 TextField(面を開かない DS の欄){/snippet}
    </TextField>

    <Combobox
      bind:value
      bind:inputValue={query}
      options={filtered}
      placeholder="押す"
      emptyLabel="候補なし"
      countLabel="{'{n}'} 件"
    >
      {#snippet label()}3 Combobox(面を開く DS の欄){/snippet}
    </Combobox>
  </Stack>

  <div style="block-size: 40vh"></div>
</Stack>
