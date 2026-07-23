/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    variant: {
      values: [
        'display-lg',
        'display-md',
        'headline-lg',
        'headline-md',
        'headline-sm',
        'title-lg',
        'title-md',
        'title-sm',
        'body-lg',
        'body-md',
        'body-sm',
        'label-lg',
        'label-md',
        'label-sm',
        'mono-md',
        'mono-sm',
      ],
      default: 'body-md',
    },
    truncate: { default: false },
    muted: { default: false },
  },
} as const;

/**
 * as は Web 層の取り決めであり中立契約に無い(Text.md §2)。意味要素(見出しの階層・段落・インライン)は
 * 各プラットフォームの a11y 表現で、Web では要素で与える。既定は中立の span(構造を主張しない)。
 */
export const WEB = {
  as: { values: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div'], default: 'span' },
} as const;
