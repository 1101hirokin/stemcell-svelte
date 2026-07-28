/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    code: {}, // コードの文字列(部品が持つ真実。複写が渡すのもこれ)
    language: {}, // 着色の道具が読む印。部品は解釈しない
    label: {}, // 送れる領域の名前(溢れているとき焦点を受けるので要る)
    wrap: { default: false },
    lineNumbers: { default: false },
  },
} as const;
