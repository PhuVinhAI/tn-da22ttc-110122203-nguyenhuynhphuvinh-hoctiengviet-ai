import { EntityManager } from 'typeorm';
import { ProgressStatus } from '../../../common/enums';
import { DailyCountRow, vnDayExpr, vnLocalExpr } from './dashboard-time.util';

const SINCE_UTC = `($1::timestamptz AT TIME ZONE 'UTC')`;

function iso(since: Date): string[] {
  return [since.toISOString()];
}

export interface AttemptsDailyRow {
  day: string;
  total: string | number;
  correct: string | number;
}

/** Lượt trả lời câu hỏi theo ngày, kèm số lượt đúng để tính độ chính xác. */
export function attemptsDaily(
  manager: EntityManager,
  since: Date,
): Promise<AttemptsDailyRow[]> {
  return manager.query(
    `
    SELECT ${vnDayExpr('attempted_at')} AS day,
           COUNT(*)::int AS total,
           SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::int AS correct
    FROM question_attempts
    WHERE deleted_at IS NULL AND attempted_at >= ${SINCE_UTC}
    GROUP BY day
    ORDER BY day ASC
    `,
    iso(since),
  );
}

/** Bài học hoàn thành theo ngày (theo completed_at). */
export function lessonsCompletedDaily(
  manager: EntityManager,
  since: Date,
): Promise<DailyCountRow[]> {
  return manager.query(
    `
    SELECT ${vnDayExpr('completed_at')} AS day, COUNT(*)::int AS count
    FROM learning_progress
    WHERE deleted_at IS NULL
      AND unit_type = 'lesson'
      AND status = '${ProgressStatus.COMPLETED}'
      AND completed_at >= ${SINCE_UTC}
    GROUP BY day
    ORDER BY day ASC
    `,
    iso(since),
  );
}

const CREATED_DAILY_TABLES = ['simulation_sessions', 'conversations'] as const;
export type CreatedDailyTable = (typeof CREATED_DAILY_TABLES)[number];

/** Số bản ghi tạo mới theo ngày của một bảng cho phép (theo created_at). */
export function createdDaily(
  manager: EntityManager,
  table: CreatedDailyTable,
  since: Date,
): Promise<DailyCountRow[]> {
  if (!CREATED_DAILY_TABLES.includes(table)) {
    throw new Error(`Bảng không hỗ trợ chuỗi created_at: ${table}`);
  }
  return manager.query(
    `
    SELECT ${vnDayExpr('created_at')} AS day, COUNT(*)::int AS count
    FROM ${table}
    WHERE deleted_at IS NULL AND created_at >= ${SINCE_UTC}
    GROUP BY day
    ORDER BY day ASC
    `,
    iso(since),
  );
}

/** Mô phỏng hoàn thành theo ngày (mốc updated_at khi chuyển COMPLETED). */
export function simulationsCompletedDaily(
  manager: EntityManager,
  since: Date,
): Promise<DailyCountRow[]> {
  return manager.query(
    `
    SELECT ${vnDayExpr('updated_at')} AS day, COUNT(*)::int AS count
    FROM simulation_sessions
    WHERE deleted_at IS NULL
      AND status = 'COMPLETED'
      AND updated_at >= ${SINCE_UTC}
    GROUP BY day
    ORDER BY day ASC
    `,
    iso(since),
  );
}

/** Phiên AI mới theo ngày = mô phỏng bắt đầu + hội thoại tạo mới. */
export function aiSessionsDaily(
  manager: EntityManager,
  since: Date,
): Promise<DailyCountRow[]> {
  return manager.query(
    `
    SELECT s.day AS day, COUNT(*)::int AS count
    FROM (
      SELECT ${vnDayExpr('created_at')} AS day
        FROM simulation_sessions
        WHERE deleted_at IS NULL AND created_at >= ${SINCE_UTC}
      UNION ALL
      SELECT ${vnDayExpr('created_at')} AS day
        FROM conversations
        WHERE deleted_at IS NULL AND created_at >= ${SINCE_UTC}
    ) AS s
    GROUP BY s.day
    ORDER BY s.day ASC
    `,
    iso(since),
  );
}

export interface HeatmapCellRow {
  weekday: number;
  hour: number;
  count: number;
}

/**
 * Mật độ lượt trả lời theo (thứ trong tuần × giờ) giờ Việt Nam —
 * weekday theo chuẩn Postgres DOW: 0 = Chủ nhật … 6 = Thứ bảy.
 */
export function attemptsHeatmap(
  manager: EntityManager,
  since: Date,
): Promise<HeatmapCellRow[]> {
  return manager.query(
    `
    SELECT EXTRACT(DOW FROM local_ts)::int AS weekday,
           EXTRACT(HOUR FROM local_ts)::int AS hour,
           COUNT(*)::int AS count
    FROM (
      SELECT ${vnLocalExpr('attempted_at')} AS local_ts
      FROM question_attempts
      WHERE deleted_at IS NULL AND attempted_at >= ${SINCE_UTC}
    ) AS t
    GROUP BY weekday, hour
    ORDER BY weekday ASC, hour ASC
    `,
    iso(since),
  );
}
