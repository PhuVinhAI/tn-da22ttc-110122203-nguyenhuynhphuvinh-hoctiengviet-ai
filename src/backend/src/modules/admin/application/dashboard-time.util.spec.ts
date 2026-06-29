import {
  fillDailySeries,
  startOfVnDay,
  toPulseMetric,
  vnDateRange,
  vnDayExpr,
  vnDayKey,
} from './dashboard-time.util';

describe('dashboard-time.util', () => {
  // 2026-06-11T01:30:00+07:00 == 2026-06-10T18:30:00Z (đã sang ngày 11 ở VN, còn ngày 10 ở UTC)
  const lateNightVn = new Date('2026-06-10T18:30:00.000Z');
  // 2026-06-11T10:00:00+07:00 == 2026-06-11T03:00:00Z
  const morningVn = new Date('2026-06-11T03:00:00.000Z');

  describe('vnDayKey', () => {
    it('dùng ngày lịch Việt Nam, không phải UTC', () => {
      expect(vnDayKey(lateNightVn)).toBe('2026-06-11');
      expect(vnDayKey(morningVn)).toBe('2026-06-11');
    });
  });

  describe('startOfVnDay', () => {
    it('trả về 00:00 giờ VN dưới dạng UTC', () => {
      expect(startOfVnDay(morningVn, 0).toISOString()).toBe(
        '2026-06-10T17:00:00.000Z',
      );
    });

    it('lùi đúng số ngày', () => {
      expect(startOfVnDay(morningVn, 13).toISOString()).toBe(
        '2026-05-28T17:00:00.000Z',
      );
    });

    it('xử lý thời điểm rạng sáng VN (vẫn là ngày hôm trước theo UTC)', () => {
      expect(startOfVnDay(lateNightVn, 0).toISOString()).toBe(
        '2026-06-10T17:00:00.000Z',
      );
    });
  });

  describe('vnDateRange', () => {
    it('trả dãy tăng dần kết thúc tại hôm nay (giờ VN)', () => {
      expect(vnDateRange(3, morningVn)).toEqual([
        '2026-06-09',
        '2026-06-10',
        '2026-06-11',
      ]);
    });
  });

  describe('vnDayExpr', () => {
    it('sinh biểu thức đổi múi giờ đúng cú pháp Postgres', () => {
      expect(vnDayExpr('attempt.attempted_at')).toBe(
        "(attempt.attempted_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')::date::text",
      );
    });
  });

  describe('fillDailySeries', () => {
    it('lấp 0 cho ngày không có dữ liệu và ép kiểu count', () => {
      const range = ['2026-06-09', '2026-06-10', '2026-06-11'];
      const rows = [
        { day: '2026-06-09', count: '4' },
        { day: '2026-06-11', count: 7 },
      ];
      expect(fillDailySeries(range, rows)).toEqual([
        { date: '2026-06-09', value: 4 },
        { date: '2026-06-10', value: 0 },
        { date: '2026-06-11', value: 7 },
      ]);
    });
  });

  describe('toPulseMetric', () => {
    it('lấy hôm nay = điểm cuối, hôm qua = điểm kề cuối', () => {
      const metric = toPulseMetric([
        { date: '2026-06-09', value: 1 },
        { date: '2026-06-10', value: 5 },
        { date: '2026-06-11', value: 3 },
      ]);
      expect(metric.today).toBe(3);
      expect(metric.yesterday).toBe(5);
      expect(metric.series).toHaveLength(3);
    });

    it('an toàn với dãy rỗng', () => {
      expect(toPulseMetric([])).toEqual({ today: 0, yesterday: 0, series: [] });
    });
  });
});
