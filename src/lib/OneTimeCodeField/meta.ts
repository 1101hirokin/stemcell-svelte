/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    name: {},
    value: { default: '' },
    length: { default: 6 },
    charset: { values: ['numeric', 'alphanumeric'], default: 'numeric' },
    masked: { default: false },
    revealLabel: {},
    concealLabel: {},
    revealedMessage: {},
    hiddenMessage: {},
    disabled: { default: false },
    readonly: { default: false },
    invalid: { default: false },
    required: { default: false },
    labelHidden: { default: false },
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
  },
} as const;

/**
 * autoReceive は Web 層の取り決めで中立契約に無い(Icon の glyph と同じ形)。ゆえに META.props
 * (契約と照合される)には入れず、Web 方言としてここに記録する。
 *
 * Chromium は届いた SMS のコードを JS から受け取る道(WebOTP)を持つ。Safari は属性だけで動く
 * (欄に autocomplete=one-time-code があれば OS が鍵盤の上に候補を出す)ので、この方言は要らない。
 * 既定では待ち受けない: 待ち受けるとブラウザの許可の確認が出るので、出す画面は消費者が選ぶ。
 */
export const WEB = {
  autoReceive: 'Web 方言: Chromium の WebOTP で SMS のコードを待ち受ける。既定は false',
} as const;

/** 打てる文字。列挙で選ぶ(正規表現は受け取らない。OneTimeCodeField.md §2)。 */
export const ALLOWED: Record<(typeof META.props.charset.values)[number], RegExp> = {
  numeric: /[0-9]/,
  alphanumeric: /[0-9A-Za-z]/,
};

/** 打たれた文字から、打てない文字を落として桁の数で頭打ちにする。 */
export const sanitize = (
  raw: string,
  charset: (typeof META.props.charset.values)[number],
  length: number,
): string => {
  const allowed = ALLOWED[charset];
  let out = '';
  for (const ch of raw) {
    if (allowed.test(ch)) out += ch;
    if (out.length === length) break;
  }
  return out;
};
