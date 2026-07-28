/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    layer: { values: ['navigation', 'popover', 'modal', 'notification', 'tooltip'] },
    alignBlock: { values: ['start', 'center', 'end'], default: 'center' },
    alignInline: { values: ['start', 'center', 'end'], default: 'center' },
  },
} as const;

/**
 * 部品の外箱を行内に置くか塊として置くかは Web 固有の区別であり、中立契約に無い(Imposter.md §3。
 * native には inline / block の対がなく、ZStack も Compose の Box も常に中身に合わせて縮む)。
 * ゆえに META.props(契約と照合される既定の源)には入れず、ここで別に持つ。Button の type と同じ形。
 */
export const WEB = {
  inline: { default: false },
} as const;
