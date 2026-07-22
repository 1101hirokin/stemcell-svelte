<script>
  import { StemcellProvider, Button, TextField, Stack, Switcher } from '@stemcell/svelte';

  let name = $state('');
  let email = $state('');
  let emailTouched = $state(false);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let emailValid = $derived(emailPattern.test(email));
  let emailInvalid = $derived(emailTouched && !emailValid);

  function handleSubmit() {
    emailTouched = true;
    if (!emailValid || name.trim() === '') {
      return;
    }
    console.log('submit', { name, email });
  }

  function handleCancel() {
    name = '';
    email = '';
    emailTouched = false;
  }
</script>

<StemcellProvider theme="auto" />

<Stack gap="lg">
  <TextField bind:value={name} autocomplete="name" required>
    {#snippet label()}氏名{/snippet}
  </TextField>

  <div onfocusout={() => (emailTouched = true)}>
    <TextField
      bind:value={email}
      keyboard="email"
      autocomplete="email"
      required
      invalid={emailInvalid}
    >
      {#snippet label()}メールアドレス{/snippet}
      {#snippet description()}ログインに使用します。例: name@example.com{/snippet}
      {#snippet error()}メールアドレスの形式が正しくありません{/snippet}
    </TextField>
  </div>

  <Switcher>
    <Button color="primary" onclick={handleSubmit}>登録する</Button>
    <Button variant="outlined" color="plain" onclick={handleCancel}>キャンセル</Button>
  </Switcher>
</Stack>
