/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    role: { values: ['user', 'assistant', 'system', 'tool'], default: 'assistant' },
    speakerLabel: {}, // 話者の名前(契約 alpha.1。DS は文言を持たない)
    // 姿を選ぶ口(契約 alpha.2)。語彙は発明せず emphasis の4段・intent・Cluster の揃えを使う
    variant: { values: ['filled', 'soft', 'outlined', 'text'], default: 'soft' },
    color: { values: ['primary', 'plain'], default: 'plain' },
    align: { values: ['start', 'center', 'end'], default: 'start' },
  },
} as const;

export type MessageRole = (typeof META.props.role.values)[number];
export type MessageVariant = (typeof META.props.variant.values)[number];
export type MessageColor = (typeof META.props.color.values)[number];
export type MessageAlign = (typeof META.props.align.values)[number];
