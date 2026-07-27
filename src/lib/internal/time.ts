/**
 * 時刻の道具(TimeField.md)。値は時刻そのもので、日付でもタイムゾーンでもない(date.md §2 と同じ立場)。
 * 中立の表記は常に 24 時間の HH:mm(秒を出すときは HH:mm:ss)で、表示が 12 時間制でも値は変わらない。
 *
 * 12 時間制で出すかどうかは環境から借りる(date.md §3。地域の慣習は借りる)。
 */

export type Time = { hour: number; minute: number; second?: number };

const pad = (n: number) => String(n).padStart(2, '0');

export const formatTime = (t: Time, seconds: boolean): string =>
  seconds ? `${pad(t.hour)}:${pad(t.minute)}:${pad(t.second ?? 0)}` : `${pad(t.hour)}:${pad(t.minute)}`;

/** HH:mm / HH:mm:ss を読む。形が違う・時計に無い値は undefined。 */
export const parseTime = (value: string): Time | undefined => {
  const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!m) return undefined;
  const t = { hour: Number(m[1]), minute: Number(m[2]), second: m[3] == null ? undefined : Number(m[3]) };
  if (t.hour > 23 || t.minute > 59 || (t.second ?? 0) > 59) return undefined;
  return t;
};

/** 分に直して比べる(下限・上限の判定に使う)。 */
export const toMinutes = (t: Time): number => t.hour * 60 + t.minute + (t.second ?? 0) / 60;

/**
 * この地域が 12 時間制で時刻を出すか。環境の書式から読む(DS は地域の一覧を持たない)。
 * 読めない環境では 24 時間制として扱う(第7条: 退避先はその環境で成立する形)。
 */
export const prefers12Hour = (): boolean => {
  try {
    const parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).formatToParts(new Date());
    return parts.some((p) => p.type === 'dayPeriod');
  } catch {
    return false;
  }
};

/** 午前・午後の名前を環境から借りる(DS は文言を持たない。i18n.md §1)。 */
export const dayPeriodNames = (): { am: string; pm: string } => {
  const read = (hour: number) => {
    try {
      const parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric', hour12: true }).formatToParts(
        new Date(2024, 0, 1, hour),
      );
      return parts.find((p) => p.type === 'dayPeriod')?.value ?? (hour < 12 ? 'AM' : 'PM');
    } catch {
      return hour < 12 ? 'AM' : 'PM';
    }
  };
  return { am: read(9), pm: read(21) };
};

/** 24 時間の値を 12 時間制の表示へ。0 時と 12 時は 12 と出す。 */
export const to12Hour = (hour: number): number => hour % 12 || 12;

/** 12 時間制の表示から 24 時間の値へ。 */
export const from12Hour = (hour12: number, pm: boolean): number => (hour12 % 12) + (pm ? 12 : 0);
