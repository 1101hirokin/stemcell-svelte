/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    name: {},
    value: { default: '' },
    length: { default: 6 },
    charset: { values: ['numeric', 'alphanumeric'], default: 'numeric' },
    masked: { default: false },
    revealLabel: {},
    hideLabel: {},
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
