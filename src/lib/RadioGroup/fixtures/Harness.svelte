<!-- テスト治具: RadioGroup + 3つの Radio。Radio は RadioGroup の文脈が要るため単体テストできない。 -->
<script lang="ts">
  import RadioGroup from '../RadioGroup.svelte';
  import Radio from '../../Radio/Radio.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    value?: string;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    disabledItem?: string;
    onchange?: (v: string) => void;
    description?: Snippet;
    error?: Snippet;
  }
  let { value, disabled, invalid, required, disabledItem, onchange, description, error }: Props = $props();
  const items = [
    { value: 'a', label: '小' },
    { value: 'b', label: '中' },
    { value: 'c', label: '大' },
  ];
</script>

<RadioGroup {value} {disabled} {invalid} {required} {onchange} {description} {error}>
  {#snippet label()}サイズ{/snippet}
  {#each items as item (item.value)}
    <Radio value={item.value} disabled={disabledItem === item.value}>
      {#snippet label()}{item.label}{/snippet}
    </Radio>
  {/each}
</RadioGroup>
