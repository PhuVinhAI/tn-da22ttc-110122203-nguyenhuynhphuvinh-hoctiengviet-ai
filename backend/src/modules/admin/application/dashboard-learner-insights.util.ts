import type { DailyStreak } from '../../daily-goals/domain/daily-streak.entity';

/**
 * Pure learner-analytics helpers extracted from AdminLearnerAnalyticsService.
 *
 * These functions take already-loaded plain data and produce derived insight
 * payloads — no DB access, no NestJS deps — so they can be unit-tested in
 * isolation (mirroring dashboard-time.util.spec.ts). The service keeps the
 * SQL/repository layer and calls into these for the final shaping.
 */

export interface LearnerHealthInput {
  lastActivityAt: Date | null;
  now: Date;
  streak: DailyStreak | null;
  overview: {
    totalQuestionsAttempted: number;
    overallAccuracy: number;
    activeDaysRate: number;
    aiConversations: number;
    simulationSessions: number;
    completedLessons: number;
    vocabularyBookmarks: number;
  };
  activityCalendar: { totalActiveDays: number; windowDays: number };
  trends: { series: Array<{ attempts: number; activeMinutes: number }> };
}

export interface LearnerHealthOutput {
  status: 'active' | 'at_risk' | 'dormant' | 'new';
  lastActiveAt: string | null;
  daysSinceLastActivity: number | null;
  riskScore: number;
  riskReasons: string[];
  engagementScore: number;
  engagementBreakdown: {
    consistency: number;
    accuracy: number;
    breadth: number;
    volume: number;
  };
}

export function computeLearnerHealth(input: LearnerHealthInput): LearnerHealthOutput {
  const reasons: string[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  const daysSinceLastActivity =
    input.lastActivityAt == null
      ? null
      : Math.floor((input.now.getTime() - input.lastActivityAt.getTime()) / dayMs);

  let status: 'active' | 'at_risk' | 'dormant' | 'new' = 'new';
  if (daysSinceLastActivity == null) {
    status = 'new';
    reasons.push('Chưa có hoạt động nào kể từ khi đăng ký');
  } else if (daysSinceLastActivity <= 2) {
    status = 'active';
  } else if (daysSinceLastActivity <= 7) {
    status = 'at_risk';
    reasons.push(`${daysSinceLastActivity} ngày không tương tác`);
  } else if (daysSinceLastActivity <= 30) {
    status = 'at_risk';
    reasons.push(`Đã ${daysSinceLastActivity} ngày không học`);
  } else {
    status = 'dormant';
    reasons.push(`Ngủ đông ${daysSinceLastActivity} ngày`);
  }

  if (input.streak?.currentStreak === 0 && (input.streak?.longestStreak ?? 0) > 3) {
    reasons.push('Đã đứt chuỗi sau khi từng giữ liên tục');
  }
  if (input.overview.overallAccuracy > 0 && input.overview.overallAccuracy < 0.55) {
    reasons.push(`Độ chính xác thấp (${Math.round(input.overview.overallAccuracy * 100)}%)`);
  }

  const recent = input.trends.series.slice(-7);
  const recentAttempts = recent.reduce((s, p) => s + p.attempts, 0);
  if (recentAttempts === 0 && daysSinceLastActivity != null && daysSinceLastActivity > 1) {
    reasons.push('Tuần qua không trả lời câu hỏi nào');
  }

  // Engagement: 4 cấu phần đều thang 0..1
  const consistency = Math.min(
    1,
    input.activityCalendar.totalActiveDays /
      Math.max(1, input.activityCalendar.windowDays * 0.5),
  );
  const accuracy = input.overview.totalQuestionsAttempted >= 5
    ? input.overview.overallAccuracy
    : 0.5;
  const surfaces = [
    input.overview.completedLessons > 0,
    input.overview.totalQuestionsAttempted > 0,
    input.overview.vocabularyBookmarks > 0,
    input.overview.aiConversations > 0,
    input.overview.simulationSessions > 0,
  ];
  const breadth = surfaces.filter(Boolean).length / surfaces.length;
  const totalActivity =
    input.overview.totalQuestionsAttempted +
    input.overview.completedLessons * 5 +
    input.overview.aiConversations * 3 +
    input.overview.simulationSessions * 4;
  const volume = Math.min(1, totalActivity / 200);

  const engagementScore = Math.round(
    (consistency * 0.3 + accuracy * 0.25 + breadth * 0.2 + volume * 0.25) * 100,
  );

  const riskScore = Math.max(
    0,
    Math.min(100, 100 - engagementScore + (daysSinceLastActivity ?? 0) * 1.5),
  );

  return {
    status,
    lastActiveAt: input.lastActivityAt?.toISOString() ?? null,
    daysSinceLastActivity,
    riskScore: Math.round(riskScore),
    riskReasons: reasons,
    engagementScore,
    engagementBreakdown: {
      consistency: Number(consistency.toFixed(4)),
      accuracy: Number(accuracy.toFixed(4)),
      breadth: Number(breadth.toFixed(4)),
      volume: Number(volume.toFixed(4)),
    },
  };
}

export interface LearnerInsightInput {
  health: { status: string; riskScore: number; daysSinceLastActivity: number | null };
  skillRadar: Array<{
    questionType: string;
    attempts: number;
    accuracy: number;
    strength: string;
  }>;
  vocabularyInsights: { totalBookmarks: number; personalImage: number; addedLast30Days: number };
  trends: { series: Array<{ attempts: number; lessonsCompleted: number; aiMessages: number }> };
  streak: DailyStreak | null;
  goalsHistory: { goalCompletionRate: number };
  simulations: { total: number; avgScore: number | null };
  conversations: { total: number; messages: number };
}

export type LearnerInsightSeverity = 'success' | 'info' | 'warning' | 'critical';

export interface LearnerInsight {
  severity: LearnerInsightSeverity;
  title: string;
  message: string;
}

export function buildLearnerInsights(input: LearnerInsightInput): LearnerInsight[] {
  const insights: LearnerInsight[] = [];

  if (input.health.status === 'active') {
    insights.push({
      severity: 'success',
      title: 'Đang hoạt động ổn định',
      message: 'Học viên tương tác đều, có thể đề xuất bài học khó hơn để giữ động lực.',
    });
  } else if (input.health.status === 'at_risk') {
    insights.push({
      severity: 'warning',
      title: 'Học viên có nguy cơ bỏ học',
      message: `${input.health.daysSinceLastActivity ?? 0} ngày không tương tác — đề xuất gửi thông báo nhắc nhở hoặc ưu đãi quay lại.`,
    });
  } else if (input.health.status === 'dormant') {
    insights.push({
      severity: 'critical',
      title: 'Học viên ngủ đông',
      message: 'Cần chiến dịch tái kích hoạt: email khuyến mãi, push notification, hoặc khảo sát.',
    });
  }

  const weak = input.skillRadar.filter((row) => row.strength === 'weak' && row.attempts >= 5);
  if (weak.length > 0) {
    insights.push({
      severity: 'warning',
      title: `Yếu ở ${weak.length} loại bài tập`,
      message: `Cân nhắc bổ sung bài luyện ${weak.map((w) => w.questionType).join(', ')} với độ khó vừa phải để cải thiện.`,
    });
  }
  const strong = input.skillRadar.filter((row) => row.strength === 'strong' && row.attempts >= 10);
  if (strong.length >= 3) {
    insights.push({
      severity: 'success',
      title: 'Đa kỹ năng mạnh',
      message: `Học viên đã thành thạo ${strong.length} loại bài tập — có thể thử bài tập tổng hợp hoặc cao cấp.`,
    });
  }

  if (input.vocabularyInsights.personalImage > 0) {
    insights.push({
      severity: 'info',
      title: 'Có xu hướng học từ ảnh',
      message: `Đã thêm ${input.vocabularyInsights.personalImage} từ qua tính năng nhận diện ảnh — phát triển thêm bộ lọc / gợi ý ngữ cảnh.`,
    });
  }
  if (input.vocabularyInsights.addedLast30Days === 0 && input.vocabularyInsights.totalBookmarks > 0) {
    insights.push({
      severity: 'info',
      title: 'Không lưu từ mới gần đây',
      message: '30 ngày qua không có từ vựng nào được lưu — nên nhắc tính năng đánh dấu từ.',
    });
  }

  const recentLessons = input.trends.series.slice(-7).reduce((s, p) => s + p.lessonsCompleted, 0);
  if (recentLessons === 0) {
    insights.push({
      severity: 'warning',
      title: 'Tuần qua không hoàn thành bài học',
      message: 'Đề xuất tạo hành trình ngắn 5–7 phút để học viên hoàn tất ngay trên di động.',
    });
  } else if (recentLessons >= 7) {
    insights.push({
      severity: 'success',
      title: 'Học siêng năng',
      message: `Đã hoàn thành ${recentLessons} bài trong 7 ngày — phù hợp để giới thiệu khóa nâng cao.`,
    });
  }

  if (input.goalsHistory.goalCompletionRate >= 0.7) {
    insights.push({
      severity: 'success',
      title: 'Đạt mục tiêu thường xuyên',
      message: `Tỷ lệ đạt mục tiêu 30 ngày: ${Math.round(input.goalsHistory.goalCompletionRate * 100)}% — có thể đề xuất tăng mục tiêu.`,
    });
  } else if (input.goalsHistory.goalCompletionRate < 0.3) {
    insights.push({
      severity: 'warning',
      title: 'Mục tiêu hàng ngày quá cao?',
      message: `Tỷ lệ đạt mục tiêu thấp (${Math.round(input.goalsHistory.goalCompletionRate * 100)}%) — đề xuất hỏi học viên để hạ mức.`,
    });
  }

  if (input.conversations.total > 0 && input.simulations.total === 0) {
    insights.push({
      severity: 'info',
      title: 'Thích trợ lý AI hơn mô phỏng',
      message: 'Học viên dùng nhiều hội thoại AI nhưng chưa thử mô phỏng — có thể đề xuất tình huống dễ làm quen.',
    });
  }
  if (input.simulations.total >= 5 && input.simulations.avgScore != null && input.simulations.avgScore >= 80) {
    insights.push({
      severity: 'success',
      title: 'Mô phỏng đạt điểm cao',
      message: `Điểm mô phỏng trung bình ${input.simulations.avgScore} — phù hợp giới thiệu tình huống chuyên ngành.`,
    });
  }

  if ((input.streak?.currentStreak ?? 0) >= 7) {
    insights.push({
      severity: 'success',
      title: `Chuỗi ${input.streak?.currentStreak} ngày`,
      message: 'Học viên giữ nhịp đều — nên gửi badge / phần thưởng khích lệ.',
    });
  }

  return insights;
}
