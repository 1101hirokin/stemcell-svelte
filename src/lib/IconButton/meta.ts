/** 既定値の単一の源。conformance が契約(extends: Button を解決したもの)と照合する。 */
export const META = {
  props: {
    // Button から継承(契約 extends。値・既定は Button と一致させる)
    variant: { values: ['filled', 'soft', 'outlined', 'text'], default: 'filled' },
    color: { values: ['primary', 'danger', 'warning', 'plain'], default: 'primary' },
    size: { values: ['sm', 'md', 'lg'], default: 'md' },
    disabled: { default: false },
    fill: { default: false },
    // IconButton 固有
    label: {}, // 名前(必須・string)。可視文字が絵に置き換わったぶん名前の経路が prop へ移る
    shape: { values: ['control', 'pill'], default: 'control' },
  },
} as const;

/**
 * type は Web 層の取り決めで中立契約に無い(Button.md §6)。ゆえに META.props(契約と照合される
 * 既定の源)には入れず、ここで別に持つ。既定 button で form 内の暗黙送信を塞ぐ(HOLES #24)。
 */
export const WEB = {
  type: { values: ['button', 'submit', 'reset'], default: 'button' },
} as const;
