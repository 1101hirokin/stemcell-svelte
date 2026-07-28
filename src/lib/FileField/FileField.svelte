<script lang="ts">
  import './FileField.css';
  import { META } from './meta';
  import { filesFrom, splitByAccept } from '../internal/files';
  import type { Snippet } from 'svelte';

  // ファイルを選ぶ欄(FileField.md)。選ばせることと、選ばれたものを値として持つことだけを担う。
  // 落とせる面は DropArea、選ばれたものの見せ方は FilePreview で、一体の姿は三つの合成である。
  interface Props {
    name?: string;
    /** 選ばれたファイルの列。要素は環境の型のまま(Web は File)。 */
    value?: File[];
    /** 受け入れる種類。MIME 型の列(image/* の総称と、Web の方言である拡張子も解く)。 */
    accept?: string[];
    multiple?: boolean;
    /** 触点でカメラを直接開く。要求であって命令ではない(持たない環境では通常の選択画面が開く)。 */
    capture?: (typeof META.props.capture.values)[number];
    /** フォルダごと選ぶ。 */
    directory?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    labelHidden?: boolean;
    size?: (typeof META.props.size.values)[number];
    /** 選ぶ操作の名前。DS は文言を持たない(i18n.md §1)。 */
    triggerLabel: string;
    /** 落とす・貼る経路で受け取ったことを耳へ届ける文のひな型({n} を件数で置き換える)。 */
    receivedLabel?: string;
    /** 弾いたことを耳へ届ける文のひな型({n} を件数で置き換える)。 */
    rejectedLabel?: string;
    onchange?: (files: File[]) => void;
    /** accept に合わないものを弾いた。何をするかはアプリが決める。 */
    onreject?: (files: File[]) => void;
    label: Snippet;
    description?: Snippet;
    error?: Snippet;
  }
  let {
    name,
    value = $bindable<File[]>([]),
    accept,
    multiple = META.props.multiple.default,
    capture,
    directory = META.props.directory.default,
    disabled = META.props.disabled.default,
    invalid = META.props.invalid.default,
    required = META.props.required.default,
    labelHidden = META.props.labelHidden.default,
    size = META.props.size.default,
    triggerLabel,
    receivedLabel,
    rejectedLabel,
    onchange,
    onreject,
    label,
    description,
    error,
  }: Props = $props();

  const uid = $props.id();
  const inputId = `${uid}-input`;
  const descriptionId = `${uid}-description`;
  const errorId = `${uid}-error`;

  let inputEl: HTMLInputElement | undefined = $state();
  let announcement = $state('');

  const publish = (files: File[]) => {
    value = files;
    onchange?.(files);
  };

  // 落とす・貼る経路の受け取り。環境の選択画面は accept で勝手に絞るが、こちらは素通しなので
  // 同じ絞り込みを当てる(FileField.md §2)。件数は部品が知っているので、部品が耳へ届ける
  const receive = (incoming: File[]) => {
    if (disabled || incoming.length === 0) return;
    const { accepted, rejected } = splitByAccept(incoming, accept);
    const taken = multiple ? accepted : accepted.slice(0, 1);
    if (taken.length > 0) publish(multiple ? [...value, ...taken] : taken);
    if (rejected.length > 0) onreject?.(rejected);
    const said = [
      taken.length > 0 && receivedLabel ? receivedLabel.replace('{n}', String(taken.length)) : '',
      rejected.length > 0 && rejectedLabel ? rejectedLabel.replace('{n}', String(rejected.length)) : '',
    ]
      .filter(Boolean)
      .join(' ');
    if (said) announcement = said;
  };

  // 貼り付けはこの欄に焦点があるときだけ受ける(画面のどこに貼っても受ける形は、他の欄への
  // 貼り付けを奪う)。ファイルの欄は paste を受け取らない環境があるので、焦点のあいだだけ
  // 文書へ張る
  let focusWithin = $state(false);
  $effect(() => {
    if (!focusWithin || disabled) return;
    const onpaste = (e: ClipboardEvent) => {
      const files = filesFrom(e.clipboardData);
      if (files.length === 0) return;
      e.preventDefault();
      receive(files);
    };
    document.addEventListener('paste', onpaste);
    return () => document.removeEventListener('paste', onpaste);
  });

  /** 落とす面など、外から受け取らせるための入口(合成する側が呼ぶ)。 */
  export const accepted = (files: File[]) => receive(files);

  // フォルダごと選ぶ(Web は webkitdirectory。標準ではないが主要ブラウザが持つ)。属性として置く:
  // 束ねる仕組みは未知の属性を DOM の性質へ渡すことがあり、その性質を持たない環境では消える
  $effect(() => {
    inputEl?.toggleAttribute('webkitdirectory', directory);
  });

  const oninput = (e: Event & { currentTarget: HTMLInputElement }) => {
    const picked = Array.from(e.currentTarget.files ?? []);
    if (picked.length > 0) publish(multiple ? [...value, ...picked] : picked);
    e.currentTarget.value = ''; // 同じファイルを選び直せるようにする
  };

  const describedby = $derived(
    [description ? descriptionId : null, invalid && error ? errorId : null].filter(Boolean).join(' ') ||
      undefined,
  );
</script>

<div
  class="sc-filefield"
  data-size={size}
  data-invalid={invalid}
  data-disabled={disabled}
  data-label-hidden={labelHidden}
  onfocusin={() => (focusWithin = true)}
  onfocusout={(e) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) focusWithin = false;
  }}
>
  <label class="sc-filefield-label" for={inputId}>
    {@render label()}{#if required}<span class="sc-filefield-required" aria-hidden="true">*</span>{/if}
  </label>
  <!-- 土台は環境のファイル選択である。入力を display:none で消して自前のボタンだけ置く形は採らない
       (焦点が当たらなくなる)。見えているボタンの上に入力を透明で重ね、押しても鍵盤で辿っても
       同じ選択画面が開くようにする -->
  <div class="sc-filefield-trigger">
    <span class="sc-filefield-trigger-face" aria-hidden="true">{triggerLabel}</span>
    <input
      class="sc-filefield-input"
      id={inputId}
      bind:this={inputEl}
      type="file"
      {name}
      {multiple}
      {required}
      {disabled}
      accept={accept?.join(',')}
      capture={capture as 'user' | 'environment' | undefined}
      aria-invalid={invalid ? 'true' : undefined}
      aria-describedby={describedby}
      {oninput}
      onchangecapture={(e) => e.stopPropagation()}
    />
  </div>
  <!-- 落とす・貼る経路の結果を耳へ届ける。常設の領域で、割り込ませない(WCAG 2.2 SC 4.1.3) -->
  <span class="sc-filefield-announcement" role="status">{announcement}</span>
  {#if description}<p class="sc-filefield-description" id={descriptionId}>{@render description()}</p>{/if}
  {#if invalid && error}<p class="sc-filefield-error" id={errorId}>{@render error()}</p>{/if}
</div>
