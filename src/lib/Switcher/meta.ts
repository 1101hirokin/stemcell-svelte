/** 既定値の単一の源。conformance が契約と照合する。 */
export const META = {
  props: {
    threshold: { default: '30rem' },
    gap: { default: 'md' },
  },
} as const;

/**
 * threshold の検査は Grid / Sidebar と共有の internal/length.ts へ移した(単位 rem の裁定と
 * 構文で裁く理由はそちらに記録)。テストの参照互換のため再輸出する。
 */
export { isRemLength } from '../internal/length';
