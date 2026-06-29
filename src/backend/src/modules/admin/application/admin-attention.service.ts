import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/domain/user.entity';

/** Ngưỡng coi một câu hỏi là "sai nhiều": tối thiểu 5 lượt làm và ≥ 40% sai. */
const HIGH_ERROR_MIN_ATTEMPTS = 5;
const HIGH_ERROR_MIN_RATE = 0.4;
const ITEMS_LIMIT = 8;

export interface AttentionGroup<T> {
  count: number;
  items: T[];
}

/**
 * Trung tâm "Cần xử lý": quét các vấn đề nội dung mà quản trị viên có thể
 * sửa ngay — câu hỏi sai nhiều, bài học trống, bài tập chưa có câu hỏi,
 * từ vựng thiếu audio, khóa học chưa xuất bản, bài tập AI sinh lỗi.
 * Mỗi item kèm đủ ID để client dựng link tới đúng màn hình soạn.
 */
@Injectable()
export class AdminAttentionService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getAttention() {
    const [
      highErrorQuestions,
      emptyLessons,
      exercisesWithoutQuestions,
      vocabulariesMissingAudio,
      draftCourses,
      failedGenerations,
    ] = await Promise.all([
      this.highErrorQuestions(),
      this.emptyLessons(),
      this.exercisesWithoutQuestions(),
      this.vocabulariesMissingAudio(),
      this.draftCourses(),
      this.failedGenerations(),
    ]);

    const totalIssues =
      highErrorQuestions.count +
      emptyLessons.count +
      exercisesWithoutQuestions.count +
      vocabulariesMissingAudio.count +
      draftCourses.count +
      failedGenerations.count;

    return {
      generatedAt: new Date().toISOString(),
      totalIssues,
      highErrorQuestions,
      emptyLessons,
      exercisesWithoutQuestions,
      vocabulariesMissingAudio,
      draftCourses,
      failedGenerations,
    };
  }

  /**
   * Chạy truy vấn item có cột `total` (COUNT(*) OVER()) và bóc thành
   * {count, items}; bảng rỗng → count 0.
   */
  private async group<T extends { total?: number }>(
    sql: string,
    params: unknown[] = [],
  ): Promise<AttentionGroup<Omit<T, 'total'>>> {
    const rows: T[] = await this.usersRepository.query(sql, params);
    const count = rows.length > 0 ? Number(rows[0].total) : 0;
    return {
      count,
      items: rows.map(({ total: _total, ...item }) => item),
    };
  }

  /** Câu hỏi (bài tập công khai) có tỷ lệ sai cao — ưu tiên rà soát nội dung. */
  private highErrorQuestions() {
    return this.group<{
      questionId: string;
      exerciseId: string;
      question: string | null;
      type: string;
      totalAttempts: number;
      incorrectCount: number;
      errorRate: number;
      total: number;
    }>(
      `
      SELECT q.id AS "questionId",
             q.exercise_id AS "exerciseId",
             q.question AS "question",
             q.question_type AS "type",
             COUNT(*)::int AS "totalAttempts",
             SUM(CASE WHEN a.is_correct THEN 0 ELSE 1 END)::int AS "incorrectCount",
             ROUND((SUM(CASE WHEN a.is_correct THEN 0 ELSE 1 END)::numeric / COUNT(*)::numeric), 4)::float AS "errorRate",
             COUNT(*) OVER()::int AS total
      FROM question_attempts a
      JOIN questions q ON q.id = a.question_id AND q.deleted_at IS NULL
      JOIN exercises e ON e.id = q.exercise_id AND e.deleted_at IS NULL AND e.is_custom = false
      WHERE a.deleted_at IS NULL
      GROUP BY q.id, q.exercise_id, q.question, q.question_type
      HAVING COUNT(*) >= $1
         AND (SUM(CASE WHEN a.is_correct THEN 0 ELSE 1 END)::numeric / COUNT(*)::numeric) >= $2
      ORDER BY "errorRate" DESC, "totalAttempts" DESC
      LIMIT ${ITEMS_LIMIT}
      `,
      [HIGH_ERROR_MIN_ATTEMPTS, HIGH_ERROR_MIN_RATE],
    );
  }

  /** Bài học chưa có nội dung nào: không Nội dung bài, Từ vựng lẫn Quy tắc ngữ pháp. */
  private emptyLessons() {
    return this.group<{
      lessonId: string;
      title: string;
      moduleId: string;
      moduleTitle: string;
      courseTitle: string;
      createdAt: Date;
      total: number;
    }>(
      `
      SELECT l.id AS "lessonId",
             l.title AS "title",
             m.id AS "moduleId",
             m.title AS "moduleTitle",
             c.title AS "courseTitle",
             l.created_at AS "createdAt",
             COUNT(*) OVER()::int AS total
      FROM lessons l
      JOIN modules m ON m.id = l.module_id AND m.deleted_at IS NULL
      JOIN courses c ON c.id = m.course_id AND c.deleted_at IS NULL
      WHERE l.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM lesson_contents lc WHERE lc.lesson_id = l.id AND lc.deleted_at IS NULL)
        AND NOT EXISTS (SELECT 1 FROM vocabularies v WHERE v.lesson_id = l.id AND v.deleted_at IS NULL)
        AND NOT EXISTS (SELECT 1 FROM grammar_rules g WHERE g.lesson_id = l.id AND g.deleted_at IS NULL)
      ORDER BY l.created_at DESC
      LIMIT ${ITEMS_LIMIT}
      `,
    );
  }

  /** Bai tap cong khai chua soan cau hoi nao. */
  private exercisesWithoutQuestions() {
    return this.group<{
      exerciseId: string;
      title: string;
      scopeTitle: string | null;
      lessonId: string | null;
      createdAt: Date;
      total: number;
    }>(
      `
      SELECT e.id AS "exerciseId",
             e.title AS "title",
             COALESCE(l.title, m.title, c.title) AS "scopeTitle",
             e.lesson_id AS "lessonId",
             e.created_at AS "createdAt",
             COUNT(*) OVER()::int AS total
      FROM exercises e
      LEFT JOIN lessons l ON l.id = e.lesson_id
      LEFT JOIN modules m ON m.id = e.module_id
      LEFT JOIN courses c ON c.id = e.course_id
      WHERE e.deleted_at IS NULL
        AND e.is_custom = false
        AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.exercise_id = e.id AND q.deleted_at IS NULL)
      ORDER BY e.created_at DESC
      LIMIT ${ITEMS_LIMIT}
      `,
    );
  }

  /** Từ vựng thiếu audio phát âm chính — ảnh hưởng trải nghiệm nghe. */
  private vocabulariesMissingAudio() {
    return this.group<{
      vocabularyId: string;
      word: string;
      translation: string;
      lessonId: string;
      lessonTitle: string;
      total: number;
    }>(
      `
      SELECT v.id AS "vocabularyId",
             v.word AS "word",
             v.translation AS "translation",
             v.lesson_id AS "lessonId",
             l.title AS "lessonTitle",
             COUNT(*) OVER()::int AS total
      FROM vocabularies v
      JOIN lessons l ON l.id = v.lesson_id AND l.deleted_at IS NULL
      WHERE v.deleted_at IS NULL AND v.audio_url IS NULL
      ORDER BY v.created_at DESC
      LIMIT ${ITEMS_LIMIT}
      `,
    );
  }

  /** Khóa học còn ở trạng thái nháp — kèm số bài học để biết độ sẵn sàng. */
  private draftCourses() {
    return this.group<{
      courseId: string;
      title: string;
      level: string;
      lessonCount: number;
      updatedAt: Date;
      total: number;
    }>(
      `
      SELECT c.id AS "courseId",
             c.title AS "title",
             c.level AS "level",
             (
               SELECT COUNT(*)::int
               FROM lessons l
               JOIN modules m ON m.id = l.module_id AND m.deleted_at IS NULL
               WHERE m.course_id = c.id AND l.deleted_at IS NULL
             ) AS "lessonCount",
             c.updated_at AS "updatedAt",
             COUNT(*) OVER()::int AS total
      FROM courses c
      WHERE c.deleted_at IS NULL AND c.is_published = false
      ORDER BY c.updated_at DESC
      LIMIT ${ITEMS_LIMIT}
      `,
    );
  }

  /** Bài tập tùy chỉnh AI sinh thất bại — tín hiệu pipeline AI gặp sự cố. */
  private failedGenerations() {
    return this.group<{
      exerciseId: string;
      title: string;
      ownerUserId: string | null;
      ownerName: string | null;
      ownerEmail: string | null;
      updatedAt: Date;
      total: number;
    }>(
      `
      SELECT e.id AS "exerciseId",
             e.title AS "title",
             e.owner_user_id AS "ownerUserId",
             u.full_name AS "ownerName",
             u.email AS "ownerEmail",
             e.updated_at AS "updatedAt",
             COUNT(*) OVER()::int AS total
      FROM exercises e
      LEFT JOIN users u ON u.id = e.owner_user_id
      WHERE e.deleted_at IS NULL AND e.generation_status = 'failed'
      ORDER BY e.updated_at DESC
      LIMIT ${ITEMS_LIMIT}
      `,
    );
  }
}
