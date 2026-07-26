import { describe, it, expect } from 'vitest';
import {
  addDays, addMonths, compare, daysInMonth, formatISO, formatMonth, isReal, monthGrid,
  parseISO, parseMonth, segmentOrder, segmentName, weekStart, weekdayNames,
} from './date';

describe('暦日の道具', () => {
  it('ISO の日付を読み書きする。暦の外の値は通さない', () => {
    expect(parseISO('2026-07-20')).toEqual({ year: 2026, month: 7, day: 20 });
    expect(formatISO({ year: 2026, month: 7, day: 5 })).toBe('2026-07-05');
    for (const bad of ['2026-02-30', '2026-13-01', '20260720', '2026-7-20', '', 'x']) {
      expect(parseISO(bad), bad).toBeUndefined();
    }
  });

  it('閏年を数える', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(isReal({ year: 2024, month: 2, day: 29 })).toBe(true);
    expect(isReal({ year: 2026, month: 2, day: 29 })).toBe(false);
  });

  it('日の加算は夏時間で1日ずれない(計算は UTC)', () => {
    // 米国の夏時間切替(2026-03-08)をまたぐ
    expect(addDays({ year: 2026, month: 3, day: 7 }, 1)).toEqual({ year: 2026, month: 3, day: 8 });
    expect(addDays({ year: 2026, month: 3, day: 8 }, 1)).toEqual({ year: 2026, month: 3, day: 9 });
    expect(addDays({ year: 2026, month: 12, day: 31 }, 1)).toEqual({ year: 2027, month: 1, day: 1 });
  });

  it('月の加算は末日へ寄せる(1月31日 + 1ヶ月 = 2月28日)', () => {
    expect(addMonths({ year: 2026, month: 1, day: 31 }, 1)).toEqual({ year: 2026, month: 2, day: 28 });
    expect(addMonths({ year: 2026, month: 12, day: 15 }, 1)).toEqual({ year: 2027, month: 1, day: 15 });
    expect(addMonths({ year: 2026, month: 1, day: 15 }, -1)).toEqual({ year: 2025, month: 12, day: 15 });
  });

  it('日の前後を比べる', () => {
    expect(compare({ year: 2026, month: 7, day: 1 }, { year: 2026, month: 7, day: 2 })).toBeLessThan(0);
    expect(compare({ year: 2026, month: 7, day: 2 }, { year: 2026, month: 7, day: 2 })).toBe(0);
  });

  it('表示する月を読み書きする', () => {
    expect(formatMonth({ year: 2026, month: 7 })).toBe('2026-07');
    expect(parseMonth('2026-07')).toEqual({ year: 2026, month: 7 });
    expect(parseMonth('2026-13')).toBeUndefined();
  });

  it('桁の並びと名前を地域から取る(DS は持たない)', () => {
    expect(segmentOrder('ja-JP')).toEqual(['year', 'month', 'day']);
    expect(segmentOrder('en-US')).toEqual(['month', 'day', 'year']);
    expect(segmentName('year', 'ja-JP')).toBe('年');
    expect(segmentName('year', 'en-US')).toBe('year');
  });

  it('週の始まりを環境から取り、答えない環境では ISO の月曜へ退避する', () => {
    expect(weekStart('ja-JP')).toBe(0); // 日曜
    expect(weekStart('de-DE')).toBe(1); // 月曜
    // 環境が答えない形を作る(getWeekInfo を持たない Intl.Locale)
    const real = Intl.Locale;
    Object.defineProperty(Intl, 'Locale', { value: class {}, configurable: true });
    expect(weekStart('ja-JP')).toBe(1);
    Object.defineProperty(Intl, 'Locale', { value: real, configurable: true });
  });

  it('曜日の見出しは週の始まりから並ぶ', () => {
    const sunday = weekdayNames(0, 'ja-JP');
    expect(sunday[0]?.long).toContain('日');
    const monday = weekdayNames(1, 'ja-JP');
    expect(monday[0]?.long).toContain('月');
    expect(sunday.length).toBe(7);
  });

  it('月の格子は週ごとの行に分かれ、前後の月は空で埋まる', () => {
    // 2026年7月1日は水曜。日曜始まりなら先頭の3セルが空
    const grid = monthGrid(2026, 7, 0);
    expect(grid[0]?.slice(0, 3)).toEqual([undefined, undefined, undefined]);
    expect(grid[0]?.[3]).toEqual({ year: 2026, month: 7, day: 1 });
    expect(grid.flat().filter(Boolean).length).toBe(31);
    for (const row of grid) expect(row.length).toBe(7);
  });
});
