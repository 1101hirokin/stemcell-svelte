<!-- テスト治具: bind:value + onchange で数字を拒否するアプリ(値の所有の検証。field.md §5)。
     bind は onchange より先に親の値を書き換えるため、拒否は「最後の正当な値」の差し戻しで行う。 -->
<script lang="ts">
  import TextField from '../TextField.svelte';

  let value = $state('abc');
  let lastValid = 'abc';
  const onchange = (v: string) => {
    if (/\d/.test(v)) {
      value = lastValid;
    } else {
      lastValid = v;
    }
  };
</script>

<TextField bind:value {onchange}>
  {#snippet label()}数字は拒否{/snippet}
</TextField>
<output data-testid="app-value">{value}</output>
