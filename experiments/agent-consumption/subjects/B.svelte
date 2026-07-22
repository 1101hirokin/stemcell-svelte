<script>
  import { StemcellProvider, Button, TextField, Stack, Switcher } from '@stemcell/svelte';

  let name = $state('');
  let email = $state('');
  let submitted = $state(false);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailInvalid = $derived(submitted && !emailPattern.test(email));

  function handleSubmit() {
    submitted = true;
    if (name.trim().length === 0 || !emailPattern.test(email)) {
      return;
    }
    // 実際の送信処理（API 呼び出し等）はアプリの関心。ここでは省略する。
    console.log('register', { name, email });
  }

  function handleCancel() {
    name = '';
    email = '';
    submitted = false;
  }
</script>

<StemcellProvider theme="auto" />

<Stack gap="lg">
  <TextField
    value={name}
    onchange={(value) => (name = value)}
    required={true}
    autocomplete="name"
  >
    {#snippet label()}氏名{/snippet}
  </TextField>

  <TextField
    value={email}
    onchange={(value) => (email = value)}
    required={true}
    keyboard="email"
    autocomplete="email"
    invalid={emailInvalid}
  >
    {#snippet label()}メールアドレス{/snippet}
    {#snippet description()}本人確認や登録完了の通知に使用します。{/snippet}
    {#snippet error()}メールアドレスの形式が正しくありません。{/snippet}
  </TextField>

  <Switcher>
    <Button variant="filled" color="primary" onclick={handleSubmit}>登録する</Button>
    <Button variant="text" color="plain" onclick={handleCancel}>キャンセル</Button>
  </Switcher>
</Stack>
