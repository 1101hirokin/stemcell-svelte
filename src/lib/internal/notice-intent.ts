/**
 * 報告 intent(color.md §5)の共有導出。Alert と Toast が同じ規範を引く(重複の集約)。
 * 割り込みの度合い: danger のみ即時(role=alert)、warning/success/info は穏当(role=status)。
 * Stemcell 独自の規範で、割り込みは動的挿入時にだけ起きる(Alert.md / color.md §5)。
 * 絵は色に頼らない識別の手がかり(WCAG 1.4.1)で、notice 一族を用途どおりに当てる。
 */
import noticeError from '@stemcell/icons/notice.error';
import noticeAlert from '@stemcell/icons/notice.alert';
import noticeOk from '@stemcell/icons/notice.ok';
import noticeInfo from '@stemcell/icons/notice.info';

export type NoticeColor = 'danger' | 'warning' | 'success' | 'info';

export function noticeRole(color: NoticeColor): 'alert' | 'status' {
  return color === 'danger' ? 'alert' : 'status';
}

export function noticeGlyph(color: NoticeColor) {
  return color === 'danger'
    ? noticeError
    : color === 'warning'
      ? noticeAlert
      : color === 'success'
        ? noticeOk
        : noticeInfo;
}
