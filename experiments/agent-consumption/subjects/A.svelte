<script lang="ts">
  import { StemcellProvider, Button, TextField, Stack, Switcher } from '@stemcell/svelte';

  let name = $state('');
  let email = $state('');
  let emailInvalid = $state(false);

  // メールアドレスの簡易な形式チェック。検証ロジックはアプリ側の責務。
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function handleNameChange(value: string) {
    name = value;
  }

  function handleEmailChange(value: string) {
    email = value;
    emailInvalid = email.length > 0 && !emailPattern.test(email);
  }

  function handleSubmit() {
    const isEmailValid = emailPattern.test(email);
    emailInvalid = email.length > 0 && !isEmailValid;

    if (name.trim() === '' || !isEmailValid) {
      return;
    }

    // 実際の送信 API 呼び出しはこの画面の外の関心。
    console.log('submit', { name, email });
  }

  function handleCancel() {
    name = '';
    email = '';
    emailInvalid = false;
  }
</script>

<StemcellProvider theme="auto" />

<Stack gap="lg">
  <TextField
    value={name}
    onchange={handleNameChange}
    required
    autocomplete="name"
  >
    {#snippet label()}氏名{/snippet}
  </TextField>

  <TextField
    value={email}
    onchange={handleEmailChange}
    required
    invalid={emailInvalid}
    keyboard="email"
    autocomplete="email"
  >
    {#snippet label()}メールアドレス{/snippet}
    {#snippet description()}確認やお知らせのご連絡に使用します{/snippet}
    {#snippet error()}メールアドレスの形式が正しくありません{/snippet}
  </TextField>

  <Switcher>
    <Button color="primary" onclick={handleSubmit}>登録する</Button>
    <Button variant="outlined" color="plain" onclick={handleCancel}>キャンセル</Button>
  </Switcher>
</Stack>
