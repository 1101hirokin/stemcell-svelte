/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    variant: { values: ['filled', 'soft', 'outlined', 'text'], default: 'filled' },
    color: { values: ['primary', 'danger', 'warning', 'plain'], default: 'primary' },
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
    disabled: { default: false },
    block: { default: false },
  },
} as const;

/**
 * type は Web 層の取り決めであり中立契約に無い(Button.md §6)。ゆえに META.props(契約と
 * 照合される既定の源)には入れず、ここで別に持つ。既定 button で form 内の暗黙送信を塞ぐ(HOLES #24)。
 */
export const WEB = {
  type: { values: ['button', 'submit', 'reset'], default: 'button' },
} as const;
