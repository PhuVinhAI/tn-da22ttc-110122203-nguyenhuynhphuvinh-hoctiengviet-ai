/**
 * Tiện ích thời gian cho dashboard admin.
 *
 * Mọi số liệu "theo ngày" trên dashboard đều tính theo ngày lịch giờ Việt Nam
 * (Asia/Ho_Chi_Minh, UTC+7, khong co DST). DB luu timestamp dang UTC
 * (timestamp without time zone).
 */

export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Khóa ngày (YYYY-MM-DD) của một thời điểm, theo lịch Việt Nam. */
export function vnDayKey(date: Date): string {
  return new Date(date.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Thời điểm UTC bắt đầu ngày Việt Nam chứa `date`, lùi về `daysBack` ngày.
 * Ví dụ: 2026-06-11T01:00+07:00, daysBack=0 → 2026-06-10T17:00:00Z.
 */
export function startOfVnDay(date: Date, daysBack = 0): Date {
  const shifted = new Date(date.getTime() + VN_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - VN_OFFSET_MS - daysBack * DAY_MS);
}

/** Dãy khóa ngày VN tăng dần, kết thúc tại ngày chứa `now`, dài `days` phần tử. */
export function vnDateRange(days: number, now: Date): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(vnDayKey(new Date(now.getTime() - i * DAY_MS)));
  }
  return keys;
}

/**
 * Biểu thức SQL đổi cột timestamp (UTC) sang khóa ngày VN dạng text —
 * dùng trong SELECT/GROUP BY của các truy vấn chuỗi theo ngày.
 */
export function vnDayExpr(column: string): string {
  return `(${column} AT TIME ZONE 'UTC' AT TIME ZONE '${VN_TIMEZONE}')::date::text`;
}

/** Biểu thức SQL đổi cột timestamp (UTC) sang giờ địa phương VN. */
export function vnLocalExpr(column: string): string {
  return `(${column} AT TIME ZONE 'UTC' AT TIME ZONE '${VN_TIMEZONE}')`;
}

export interface DailyCountRow {
  day: string;
  count: string | number;
}

/**
 * Trải các dòng {day, count} thưa từ SQL thành dãy đặc theo `range`,
 * ngày thiếu lấp 0.
 */
export function fillDailySeries(
  range: string[],
  rows: DailyCountRow[],
): { date: string; value: number }[] {
  const byDay = new Map(rows.map((r) => [String(r.day), Number(r.count)]));
  return range.map((date) => ({ date, value: byDay.get(date) ?? 0 }));
}

export interface PulseMetric {
  today: number;
  yesterday: number;
  series: { date: string; value: number }[];
}

/** Gom dãy ngày đã lấp thành PulseMetric (điểm cuối = hôm nay). */
export function toPulseMetric(
  series: { date: string; value: number }[],
): PulseMetric {
  const today = series.length > 0 ? series[series.length - 1].value : 0;
  const yesterday = series.length > 1 ? series[series.length - 2].value : 0;
  return { today, yesterday, series };
}
