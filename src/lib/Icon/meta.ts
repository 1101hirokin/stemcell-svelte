/** 既定値の単一の源。conformance が契約と照合する。name は語彙凍結まで string(iconography.md §3)。 */
export const META = {
  props: {
    name: {},
    label: {},
  },
} as const;

/**
 * glyph は Web 層の取り決めで中立契約に無い(iconography.md §6。Button の type と同じ)。ゆえに
 * META.props(契約と照合される)には入れず、Web 方言としてここに記録する。静的に取ったグリフを
 * 渡すとツリーシェイクが効く。conformance の照合対象外。
 */
export const WEB = {
  glyph: 'Web 方言: import g from "@stemcell/icons/<name>" して渡す。使った分だけ束に入る',
} as const;
