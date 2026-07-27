/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    // 変化の向きだけ(良し悪しは持たない。増えたら悪い指標が同じだけ実在する)
    trend: { values: ['up', 'down', 'flat'] },
    // 変化の評価はアプリの政策。器は向きから導かない
    color: { values: ['success', 'danger', 'plain'], default: 'plain' },
  },
} as const;

export type StatTrend = (typeof META.props.trend.values)[number];
export type StatColor = (typeof META.props.color.values)[number];
