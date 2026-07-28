<script lang="ts">
  import './field-button.css';
  import Icon from '../Icon/Icon.svelte';

  // 値をまとめて消す操作(TextField.md §2)。TextField から一族(Textarea / PasswordField / NumberField)へ
  // 降りる prop なので、姿と手触りは一箇所で持つ。焦点を受けるので当たり判定の門(24px)が生きる。
  interface Props {
    /** 操作の名前。DS は文言を持たない(i18n.md §1)。 */
    label?: string;
    onclear: () => void;
  }
  let { label, onclear }: Props = $props();
</script>

<button type="button" class="sc-field-button sc-field-clear" aria-label={label} onclick={onclear}>
  <Icon name="close" />
</button>
