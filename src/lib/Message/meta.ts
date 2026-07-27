/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    role: { values: ['user', 'assistant', 'system', 'tool'], default: 'assistant' },
    speakerLabel: {}, // 話者の名前(契約 alpha.1。DS は文言を持たない)
  },
} as const;

export type MessageRole = (typeof META.props.role.values)[number];
