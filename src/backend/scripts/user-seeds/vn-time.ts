/** Mirror backend dashboard-time.util.ts for seed generation. */

export const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function vnDayKey(date: Date): string {
  return new Date(date.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

export function startOfVnDay(date: Date, daysBack = 0): Date {
  const shifted = new Date(date.getTime() + VN_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - VN_OFFSET_MS - daysBack * DAY_MS);
}

export function vnDayFromOffset(base: Date, dayOffset: number): string {
  return vnDayKey(new Date(base.getTime() + dayOffset * DAY_MS));
}

export function daysBetween(fromDate: string, toDate: string): number {
  const from = new Date(`${fromDate}T00:00:00.000Z`).getTime();
  const to = new Date(`${toDate}T00:00:00.000Z`).getTime();
  return Math.round((to - from) / DAY_MS);
}

/** UTC instant for a VN local wall-clock time on a VN calendar day. */
export function vnLocalToUtc(vnDate: string, hour: number, minute: number, second = 0): Date {
  const utcMs =
    Date.parse(`${vnDate}T00:00:00.000Z`) - VN_OFFSET_MS + (hour * 3600 + minute * 60 + second) * 1000;
  return new Date(utcMs);
}

export function vnDateRangeInclusive(fromDay: string, toDay: string): string[] {
  const days: string[] = [];
  let cursor = fromDay;
  while (cursor <= toDay) {
    days.push(cursor);
    cursor = vnDayKey(new Date(Date.parse(`${cursor}T00:00:00.000Z`) + DAY_MS));
  }
  return days;
}
