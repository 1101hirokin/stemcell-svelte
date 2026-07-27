import { isTier, isGlobalPrimitive, warnSpacing } from './spacing';

/**
 * 間隔 prop(gap / inset)の値をどう解くかを一箇所に置く(layout.md §6)。
 * 段(sm/md/lg)か大域の原始(8〜24)かを判じ、どちらでもなければ警告して既定へ退避する。
 * 同じ4行が8つのプリミティブへ写し取られていたのを集約した(挙動は変えていない)。
 */
export function useGap(component: string, prop: string, value: () => string, fallback: string) {
  const tier = $derived(isTier(value()));
  const primitive = $derived(!tier && isGlobalPrimitive(value()));
  $effect(() => {
    if (!tier && !primitive) warnSpacing(component, prop, value(), `既定の "${fallback}" `);
  });
  return {
    get tier() {
      return tier;
    },
    get primitive() {
      return primitive;
    },
  };
}
