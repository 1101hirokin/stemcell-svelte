/**
 * 暦日の道具(date.md)。値は暦日であって時刻でもタイムゾーンでもないので、計算はすべて UTC で行う
 * (地方時で行うと、夏時間の切替日に1日ずれる)。中立の表記は ISO 8601 の日付(YYYY-MM-DD)。
 *
 * 地域の慣習(桁の並び・桁の名前・週の始まり・月名・曜日名)は環境から借りる(date.md §3)。
 * DS はこれらの文字列を持たない。
 */

/** 暦日。年・月(1-12)・日の組。 */
export type Day = { year: number; month: number; day: number };

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

export const formatISO = (d: Day): string => `${pad(d.year, 4)}-${pad(d.month)}-${pad(d.day)}`;

/** ISO の日付を読む。形が違う・実在しない日は undefined(暦の外の値を通さない)。 */
export const parseISO = (value: string): Day | undefined => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return undefined;
  const day = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  return isReal(day) ? day : undefined;
};

/** その年月に実在する日か(2月30日を弾く)。 */
export const isReal = (d: Day): boolean =>
  d.month >= 1 && d.month <= 12 && d.day >= 1 && d.day <= daysInMonth(d.year, d.month);

export const daysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

const toUTC = (d: Day) => Date.UTC(d.year, d.month - 1, d.day);
const fromUTC = (ms: number): Day => {
  const t = new Date(ms);
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
};

export const addDays = (d: Day, n: number): Day => fromUTC(toUTC(d) + n * 86400000);

/** 月を足す。日が新しい月に無ければ末日へ寄せる(1月31日 + 1ヶ月 = 2月28日)。 */
export const addMonths = (d: Day, n: number): Day => {
  const total = d.year * 12 + (d.month - 1) + n;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return { year, month, day: Math.min(d.day, daysInMonth(year, month)) };
};

/** 負なら a が前、正なら a が後、0 なら同じ日。 */
export const compare = (a: Day, b: Day): number => toUTC(a) - toUTC(b);
export const isSame = (a: Day | undefined, b: Day | undefined): boolean =>
  !!a && !!b && compare(a, b) === 0;
export const isBetween = (d: Day, start: Day, end: Day): boolean =>
  compare(d, start) >= 0 && compare(d, end) <= 0;

/** 今日(地方時で見た今日。利用者にとっての今日は地方時である)。 */
export const today = (): Day => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
};

/** 表示している月(YYYY-MM)。 */
export const formatMonth = (d: Pick<Day, 'year' | 'month'>): string => `${pad(d.year, 4)}-${pad(d.month)}`;
export const parseMonth = (value: string): { year: number; month: number } | undefined => {
  const m = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!m) return undefined;
  const month = Number(m[2]);
  return month >= 1 && month <= 12 ? { year: Number(m[1]), month } : undefined;
};

export type SegmentType = 'year' | 'month' | 'day';

/**
 * 桁の並びを地域から取る(年/月/日・月/日/年・日/月/年)。DS は並びを決めない(date.md §3)。
 * 環境が答えないときは ISO の並び(年・月・日)へ退避する(第7条)。
 */
export const segmentOrder = (locale?: string): SegmentType[] => {
  try {
    const parts = new Intl.DateTimeFormat(locale).formatToParts(new Date(2026, 0, 2));
    const order = parts
      .map((p) => p.type)
      .filter((t): t is SegmentType => t === 'year' || t === 'month' || t === 'day');
    if (order.length === 3) return order;
  } catch {
    // 環境が答えない
  }
  return ['year', 'month', 'day'];
};

/** 桁の名前(「年」「月」「日」)。環境が持つ語を借りる。 */
export const segmentName = (type: SegmentType, locale?: string): string => {
  try {
    return new Intl.DisplayNames(locale, { type: 'dateTimeField' }).of(type) ?? type;
  } catch {
    return type;
  }
};

/**
 * 週の始まり(0=日曜 … 6=土曜)。環境が答えるならそれに従う。
 * 答えない古い環境では ISO 8601 の定義(週は月曜に始まる)へ退避する(date.md §3。第7条)。
 */
export const weekStart = (locale?: string): number => {
  try {
    const info = (new Intl.Locale(locale ?? navigator.language) as unknown as {
      getWeekInfo?: () => { firstDay: number };
    }).getWeekInfo?.();
    // Intl は 1=月曜 … 7=日曜。曜日番号(0=日曜)へ写す
    if (info) return info.firstDay % 7;
  } catch {
    // 環境が答えない
  }
  return 1;
};

/** 月名(「2026年7月」等)。環境の書式を借りる。 */
export const monthLabel = (year: number, month: number, locale?: string): string => {
  try {
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
      new Date(Date.UTC(year, month - 1, 1)),
    );
  } catch {
    return `${year}-${pad(month)}`;
  }
};

/** 曜日の見出し(週の始まりから並べる)。長い名前は支援技術へ、短い名前は見出しへ。 */
export const weekdayNames = (
  start: number,
  locale?: string,
): { short: string; long: string }[] => {
  const out: { short: string; long: string }[] = [];
  for (let i = 0; i < 7; i++) {
    // 2026-02-01 は日曜。そこから曜日を作る
    const date = new Date(Date.UTC(2026, 1, 1 + ((start + i) % 7)));
    try {
      out.push({
        short: new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' }).format(date),
        long: new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(date),
      });
    } catch {
      out.push({ short: String((start + i) % 7), long: String((start + i) % 7) });
    }
  }
  return out;
};

/** 月の格子。週ごとの行に分け、前後の月にはみ出すセルは undefined で埋める。 */
export const monthGrid = (year: number, month: number, start: number): (Day | undefined)[][] => {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const lead = (first - start + 7) % 7;
  const total = daysInMonth(year, month);
  const cells: (Day | undefined)[] = [
    ...Array.from({ length: lead }, () => undefined),
    ...Array.from({ length: total }, (_, i) => ({ year, month, day: i + 1 })),
  ];
  while (cells.length % 7 !== 0) cells.push(undefined);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
};
