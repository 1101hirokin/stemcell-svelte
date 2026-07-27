/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    busy: { default: false },
    following: {},
    resumeLabel: {}, // 末尾へ戻る操作の名前(契約 alpha.1)
  },
} as const;
