<script>
  import { Button, Checkbox, Stack, StemcellProvider } from '@stemcell/svelte';
  import '@stemcell/tokens/standard.css';

  let termsChecked = $state(false);
  let termsInvalid = $state(false);
  let newsletterChecked = $state(false);
  let child1Checked = $state(false);
  let child2Checked = $state(false);

  let selectAllChecked = $derived(child1Checked && child2Checked);
  let selectAllIndeterminate = $derived(
    (child1Checked || child2Checked) && !(child1Checked && child2Checked)
  );

  function handleTermsChange(value) {
    termsChecked = value;
    if (value) termsInvalid = false;
  }
  function handleSelectAllChange(value) {
    child1Checked = value;
    child2Checked = value;
  }
  function handleSubmit(event) {
    event.preventDefault();
    if (!termsChecked) { termsInvalid = true; return; }
    termsInvalid = false;
    console.log('submit', { termsChecked, newsletterChecked, child1Checked, child2Checked });
  }
</script>

<StemcellProvider theme="auto" />

<form onsubmit={handleSubmit}>
  <Stack gap="lg">
    <Checkbox checked={termsChecked} required invalid={termsInvalid} onchange={handleTermsChange}>
      {#snippet label()}
        <a href="/terms" target="_blank" rel="noopener noreferrer" data-testid="terms-link">利用規約</a>に同意します
      {/snippet}
      {#snippet error()}利用規約への同意が必要です{/snippet}
    </Checkbox>
    <Checkbox checked={newsletterChecked} onchange={(value) => (newsletterChecked = value)}>
      {#snippet label()}ニュースレターを購読する{/snippet}
    </Checkbox>
    <Stack gap="sm">
      <Checkbox checked={selectAllChecked} indeterminate={selectAllIndeterminate} onchange={handleSelectAllChange}>
        {#snippet label()}全て選択{/snippet}
      </Checkbox>
      <Stack gap="sm">
        <Checkbox checked={child1Checked} onchange={(value) => (child1Checked = value)}>
          {#snippet label()}サービスからのお知らせを受け取る{/snippet}
        </Checkbox>
        <Checkbox checked={child2Checked} onchange={(value) => (child2Checked = value)}>
          {#snippet label()}キャンペーン情報を受け取る{/snippet}
        </Checkbox>
      </Stack>
    </Stack>
    <Button type="submit">送信する</Button>
  </Stack>
</form>
