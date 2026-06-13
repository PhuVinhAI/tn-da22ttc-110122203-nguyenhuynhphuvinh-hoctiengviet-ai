import { useNavigate, useParams } from 'react-router'
import {
  Activity,
  AlertTriangle,
  Award,
  BookMarked,
  BookOpen,
  Bot,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Flame,
  Gauge,
  GraduationCap,
  Image as ImageIcon,
  Info,
  LineChart,
  Mail,
  MessageCircle,
  MessageSquare,
  Radar as RadarIcon,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  User2,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { LearnerDetailSkeleton } from '../../components/admin/PageSkeletons'
import { ErrorState, errorMessage } from '../../components/admin/ErrorState'
import { useAdminLearnerAnalytics } from '../../features/learners/api/use-learners-admin'
import type {
  CourseProgressRow,
  LearnerAnalytics,
  LearnerInsight,
  RecentVocabulary,
} from '../../features/learners/types'
import { learnerPath } from './route-utils'
import {
  ActivityCalendarChart,
  DifficultyChart,
  DonutChart,
  GoalsStrip,
  HourHeatmap,
  PartOfSpeechBars,
  SkillBarsCompact,
  SkillRadarChart,
  SpeedHistogramChart,
  TrendsChart,
} from './learner-charts'
import {
  AMBER,
  BLUE,
  CYAN,
  EMERALD,
  EmptyChart,
  FUCHSIA,
  formatCompact,
  formatDateLong,
  formatDuration,
  formatNumber,
  formatPercent,
  formatRelative,
  getInitials,
  GREEN,
  hashColor,
  HEALTH_LABEL,
  HEALTH_TINT,
  INDIGO,
  INSIGHT_TINT,
  LEVEL_COLOR,
  LEVEL_LABEL,
  ORANGE,
  PART_OF_SPEECH_LABEL,
  QUESTION_TYPE_LABEL,
  ROSE,
  SectionCard,
  STRENGTH_LABEL,
  STRENGTH_TINT,
  TEAL,
  VIOLET,
  VOCAB_SOURCE_LABEL,
} from './learner-ui'

export function LearnerDetailPage() {
  const { learnerId } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch, isFetching } = useAdminLearnerAnalytics(learnerId)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Học viên', href: learnerPath.learners() },
          { label: data?.user?.fullName ?? 'Chi tiết' },
        ]}
      />

      {isLoading ? (
        <LearnerDetailSkeleton />
      ) : error ? (
        <ErrorState
          message={errorMessage(error)}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : data ? (
        <Dashboard data={data} learnerId={learnerId!} onNavigate={navigate} />
      ) : null}
    </div>
  )
}

interface DashboardProps {
  data: LearnerAnalytics
  learnerId: string
  onNavigate: (path: string) => void
}

function Dashboard({ data, learnerId, onNavigate }: DashboardProps) {
  return (
    <>
      <ProfileHero data={data} />
      <KpiStrip data={data} />
      <InsightsRow insights={data.insights} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <SectionCard
            title="Lịch hoạt động 90 ngày"
            hint="Mỗi ô là một ngày — đậm hơn nghĩa là học nhiều hơn"
            icon={Calendar}
            iconTint={EMERALD}
          >
            <ActivityCalendarChart calendar={data.activityCalendar} />
          </SectionCard>

          <SectionCard
            title="Xu hướng học 30 ngày"
            hint="Lượt trả lời, bài học hoàn thành, từ mới và tin AI mỗi ngày"
            icon={LineChart}
            iconTint={INDIGO}
          >
            <TrendsChart series={data.trends.series} />
          </SectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard
              title="Bản đồ kỹ năng"
              hint="Độ chính xác theo loại bài tập (0–100%)"
              icon={RadarIcon}
              iconTint={VIOLET}
            >
              <SkillRadarChart data={data.skillRadar} />
              <SkillSummary data={data.skillRadar} />
            </SectionCard>

            <SectionCard
              title="Hiệu suất theo độ khó"
              hint="Tỷ lệ đúng/sai phân bố theo mức độ khó câu hỏi"
              icon={Gauge}
              iconTint={AMBER}
            >
              <DifficultyChart data={data.difficultyBreakdown} />
            </SectionCard>
          </div>

          <SectionCard
            title="Giờ học cao điểm"
            hint="Phân bố hoạt động theo thứ trong tuần và giờ (giờ Việt Nam)"
            icon={Clock}
            iconTint={CYAN}
          >
            <HourHeatmap cells={data.hourHeatmap} />
          </SectionCard>

          <SectionCard
            title="Tốc độ trả lời câu hỏi"
            hint="Phân bố thời gian giải mỗi câu — phản chiếu mức tự tin"
            icon={Zap}
            iconTint={ORANGE}
          >
            <SpeedHistogramChart data={data.speedHistogram} />
          </SectionCard>

          <SectionCard
            title="Tiến độ khóa học"
            hint={`${data.overview.completedCourses} khóa hoàn thành · ${data.courseProgress.length} khóa đang theo dõi`}
            icon={GraduationCap}
            iconTint={BLUE}
          >
            <CourseProgressList rows={data.courseProgress} />
          </SectionCard>

          <SectionCard
            title="Hoạt động AI gần đây"
            hint={`Hội thoại trợ lý · ${formatNumber(data.aiUsage.conversations.total)} phiên · ${formatNumber(data.aiUsage.conversations.tokens)} tokens`}
            icon={Bot}
            iconTint={FUCHSIA}
          >
            <ConversationsList
              data={data.aiUsage.conversations}
              learnerId={learnerId}
              onNavigate={onNavigate}
            />
          </SectionCard>

          <SectionCard
            title="Phiên mô phỏng hội thoại"
            hint={`Điểm trung bình: ${data.aiUsage.simulations.avgScore ?? '—'} · Điểm cao nhất: ${data.aiUsage.simulations.bestScore ?? '—'}`}
            icon={MessageCircle}
            iconTint={ROSE}
          >
            <SimulationsBlock
              data={data.aiUsage.simulations}
              learnerId={learnerId}
              onNavigate={onNavigate}
            />
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <SectionCard
            title="Sức khoẻ học viên"
            hint="Chỉ số tổng hợp về độ tương tác và rủi ro rời bỏ"
            icon={Activity}
            iconTint={data.health.status === 'active' ? EMERALD : data.health.status === 'at_risk' ? AMBER : ROSE}
          >
            <HealthPanel data={data} />
          </SectionCard>

          <SectionCard
            title="Mục tiêu hàng ngày"
            hint="Tỷ lệ đạt mục tiêu trong 30 ngày qua"
            icon={Target}
            iconTint={GREEN}
          >
            <GoalsPanel data={data} />
          </SectionCard>

          <SectionCard
            title="Phân tích kỹ năng"
            hint="Liệt kê chi tiết theo loại bài tập"
            icon={Brain}
            iconTint={VIOLET}
            compact
          >
            <SkillBarsCompact data={data.skillRadar} />
          </SectionCard>

          <SectionCard
            title="Phân tích từ vựng"
            hint={`${formatNumber(data.vocabularyInsights.totalBookmarks)} từ đã lưu`}
            icon={BookMarked}
            iconTint={TEAL}
          >
            <VocabularyPanel data={data} />
          </SectionCard>
        </aside>
      </div>
    </>
  )
}

// ─── Profile hero ────────────────────────────────────────────────────────────
function ProfileHero({ data }: { data: LearnerAnalytics }) {
  const user = data.user
  const level = user.currentLevel
  const levelColor = LEVEL_COLOR[level] ?? INDIGO
  const health = HEALTH_TINT[data.health.status]
  const reasonText = data.health.riskReasons[0]
  const tint = hashColor(user.id)

  return (
    <div className="rounded-xl border-2 border-border bg-card p-5">
      <div className="flex items-start gap-4 flex-wrap">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.fullName}
            className="h-20 w-20 shrink-0 rounded-2xl border-2 border-border object-cover"
          />
        ) : (
          <div
            className="h-20 w-20 shrink-0 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: tint }}
          >
            {getInitials(user.fullName)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold text-white"
              style={{ backgroundColor: levelColor }}
            >
              {level} · {LEVEL_LABEL[level] ?? '—'}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold ${health.bg} ${health.text}`}
            >
              <span className={`h-2 w-2 rounded-full ${health.dot}`} />
              {HEALTH_LABEL[data.health.status]}
            </span>
            {user.preferredDialect && (
              <span className="inline-flex items-center rounded-md border-2 border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Giọng {user.preferredDialect}
              </span>
            )}
            {user.role !== 'user' && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground capitalize">
                {user.role}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {user.fullName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {user.email}
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Tham gia {formatDateLong(user.createdAt)} · {data.overview.daysSinceJoined} ngày
            · Hoạt động lần cuối {formatRelative(data.health.lastActiveAt)}
          </p>
          {reasonText && (
            <p
              className={`text-xs mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${health.bg} ${health.text}`}
            >
              <AlertTriangle className="h-3 w-3" />
              {reasonText}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <EngagementRing score={data.health.engagementScore} />
          <StreakBadge
            current={data.overview.currentStreak}
            longest={data.overview.longestStreak}
          />
        </div>
      </div>
    </div>
  )
}

function EngagementRing({ score }: { score: number }) {
  const radius = 30
  const stroke = 6
  const circ = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, score))
  const offset = circ - (pct / 100) * circ
  const color =
    pct >= 70 ? EMERALD : pct >= 40 ? AMBER : ROSE
  return (
    <div className="relative shrink-0">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle cx={40} cy={40} r={radius} fill="transparent" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={40}
          cy={40}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xl font-bold tabular-nums leading-none">{pct}</p>
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
          Engage
        </p>
      </div>
    </div>
  )
}

function StreakBadge({ current, longest }: { current: number; longest: number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border-2 border-border bg-card px-3 py-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
        <Flame className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Streak
        </p>
        <p className="text-lg font-bold tabular-nums">
          {current} <span className="text-xs font-normal text-muted-foreground">ngày</span>
        </p>
      </div>
      <div className="h-10 w-0.5 bg-border hidden sm:block" aria-hidden />
      <div className="hidden sm:block">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Award className="h-3 w-3" />
          Kỷ lục
        </p>
        <p className="text-sm font-bold tabular-nums">{longest} ngày</p>
      </div>
    </div>
  )
}

// ─── KPI strip ───────────────────────────────────────────────────────────────
function KpiStrip({ data }: { data: LearnerAnalytics }) {
  const accuracy = data.overview.overallAccuracy
  const tokenLabel = formatCompact(data.overview.aiTokensUsed)
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      <KpiCard
        icon={Clock}
        label="Tổng thời gian học"
        value={formatDuration(data.overview.totalLearningTime)}
        tone={CYAN}
      />
      <KpiCard
        icon={BookOpen}
        label="Bài học hoàn thành"
        value={formatNumber(data.overview.completedLessons)}
        sub={`${formatNumber(data.overview.lessonsInProgress)} đang dở`}
        tone={INDIGO}
      />
      <KpiCard
        icon={CheckCircle2}
        label="Lượt trả lời"
        value={formatNumber(data.overview.totalQuestionsAttempted)}
        sub={`${formatNumber(data.overview.correctAttempts)} đúng`}
        tone={EMERALD}
      />
      <KpiCard
        icon={Gauge}
        label="Độ chính xác"
        value={formatPercent(accuracy)}
        tone={accuracy >= 0.7 ? EMERALD : accuracy >= 0.5 ? AMBER : ROSE}
      />
      <KpiCard
        icon={Sparkles}
        label="Từ vựng đã lưu"
        value={formatNumber(data.overview.vocabularyBookmarks)}
        sub={`${formatNumber(data.overview.personalVocabulary)} cá nhân`}
        tone={VIOLET}
      />
      <KpiCard
        icon={Bot}
        label="Token AI dùng"
        value={tokenLabel}
        sub={`${data.aiUsage.conversations.total} hội thoại`}
        tone={FUCHSIA}
      />
      <KpiCard
        icon={MessageCircle}
        label="Mô phỏng"
        value={`${data.overview.completedSimulations}/${data.overview.simulationSessions}`}
        sub={data.overview.avgSimulationScore != null ? `Điểm TB ${data.overview.avgSimulationScore}` : 'Chưa có điểm'}
        tone={ROSE}
      />
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  tone: string
}) {
  return (
    <div className="rounded-lg border-2 border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ backgroundColor: `${tone}1F`, color: tone }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
          {label}
        </p>
      </div>
      <p className="text-xl font-bold tabular-nums mt-2 tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

// ─── Insights row ────────────────────────────────────────────────────────────
const INSIGHT_ICON: Record<LearnerInsight['severity'], LucideIcon> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  critical: AlertTriangle,
}

function InsightsRow({ insights }: { insights: LearnerInsight[] }) {
  if (insights.length === 0) return null
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {insights.map((insight, idx) => {
        const tint = INSIGHT_TINT[insight.severity]
        const Icon = INSIGHT_ICON[insight.severity]
        return (
          <div
            key={idx}
            className={`rounded-lg border-2 ${tint.border} ${tint.bg} p-3 flex items-start gap-3`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${tint.iconBg}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-bold ${tint.text}`}>{insight.title}</p>
              <p className={`text-xs mt-0.5 ${tint.text} opacity-90 leading-relaxed`}>
                {insight.message}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Skill summary ───────────────────────────────────────────────────────────
function SkillSummary({ data }: { data: LearnerAnalytics['skillRadar'] }) {
  const counts = data.reduce(
    (acc, row) => {
      acc[row.strength] = (acc[row.strength] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
  return (
    <div className="mt-4 pt-4 border-t-2 border-border flex flex-wrap items-center gap-2">
      {(['strong', 'average', 'weak', 'untested'] as const).map((key) => {
        const value = counts[key] ?? 0
        if (value === 0) return null
        return (
          <span
            key={key}
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${STRENGTH_TINT[key]}`}
          >
            <span className="tabular-nums">{value}</span>
            {STRENGTH_LABEL[key]}
          </span>
        )
      })}
    </div>
  )
}

// ─── Health panel ────────────────────────────────────────────────────────────
function HealthPanel({ data }: { data: LearnerAnalytics }) {
  const { health } = data
  const tint = HEALTH_TINT[health.status]
  const breakdown = [
    { label: 'Nhất quán', value: health.engagementBreakdown.consistency, icon: Calendar, color: INDIGO },
    { label: 'Chính xác', value: health.engagementBreakdown.accuracy, icon: Gauge, color: EMERALD },
    { label: 'Đa dạng', value: health.engagementBreakdown.breadth, icon: Compass, color: AMBER },
    { label: 'Khối lượng', value: health.engagementBreakdown.volume, icon: Activity, color: VIOLET },
  ]
  return (
    <div className="space-y-4">
      <div className={`rounded-lg border-2 border-border p-3 ${tint.bg}`}>
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${tint.dot}`} />
          <p className={`text-sm font-bold ${tint.text}`}>{HEALTH_LABEL[health.status]}</p>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Engagement</p>
            <p className="text-xl font-bold tabular-nums">{health.engagementScore}/100</p>
          </div>
          <div>
            <p className="text-muted-foreground">Risk score</p>
            <p className="text-xl font-bold tabular-nums">{health.riskScore}/100</p>
          </div>
        </div>
        {health.riskReasons.length > 0 && (
          <ul className="mt-3 pt-3 border-t border-border/50 space-y-1">
            {health.riskReasons.map((reason, idx) => (
              <li
                key={idx}
                className={`text-[11px] flex items-start gap-1.5 ${tint.text}`}
              >
                <ChevronRight className="h-3 w-3 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2.5">
        {breakdown.map((b) => {
          const pct = Math.round(b.value * 100)
          return (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <b.icon className="h-3.5 w-3.5" style={{ color: b.color }} />
                  {b.label}
                </span>
                <span className="text-xs font-bold tabular-nums">{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: b.color }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t-2 border-border text-xs">
        <Stat label="Tham gia" value={`${data.overview.daysSinceJoined} ngày`} />
        <Stat
          label="Ngày học"
          value={`${data.overview.activeDays}/${data.overview.daysSinceJoined}`}
        />
        <Stat label="Tỷ lệ ngày học" value={formatPercent(data.overview.activeDaysRate, 0)} />
        <Stat label="Lần cuối" value={formatRelative(health.lastActiveAt)} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-2.5 py-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums mt-0.5 truncate">{value}</p>
    </div>
  )
}

// ─── Goals panel ─────────────────────────────────────────────────────────────
function GoalsPanel({ data }: { data: LearnerAnalytics }) {
  const goals = data.goals
  return (
    <div className="space-y-4">
      <GoalsStrip
        days={goals.goalCompletionLast30Days}
        goalCompletionRate={goals.goalCompletionRate}
      />

      {goals.daily.length > 0 ? (
        <div className="space-y-2 pt-3 border-t-2 border-border">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Mục tiêu / ngày
          </p>
          <div className="grid grid-cols-1 gap-2">
            {goals.daily.map((goal) => (
              <div
                key={goal.goalType}
                className="rounded-md border border-border bg-muted/30 px-3 py-2 flex items-center gap-2"
              >
                <span className="text-xs font-bold text-muted-foreground capitalize">
                  {goal.goalType.toLowerCase()}
                </span>
                <span className="ml-auto text-base font-bold tabular-nums">
                  {goal.targetValue}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Học viên chưa đặt mục tiêu hàng ngày</p>
      )}

      <div className="pt-3 border-t-2 border-border grid grid-cols-2 gap-2">
        <Stat
          label="Streak hiện tại"
          value={`${goals.streakSummary.currentStreak} ngày`}
        />
        <Stat
          label="Hôm nay"
          value={goals.streakSummary.todayMet ? 'Đã đạt' : 'Chưa đạt'}
        />
      </div>
    </div>
  )
}

// ─── Vocabulary panel ────────────────────────────────────────────────────────
function VocabularyPanel({ data }: { data: LearnerAnalytics }) {
  const v = data.vocabularyInsights
  const sources = [
    { label: VOCAB_SOURCE_LABEL.system, value: v.systemBookmarks, color: INDIGO },
    { label: VOCAB_SOURCE_LABEL.manual, value: v.personalManual, color: VIOLET },
    { label: VOCAB_SOURCE_LABEL.image, value: v.personalImage, color: TEAL },
  ]
  return (
    <div className="space-y-5">
      <DonutChart
        slices={sources}
        totalLabel="Tổng đã lưu"
        totalValue={v.totalBookmarks}
      />
      <div className="pt-3 border-t-2 border-border">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Phân loại từ loại
        </p>
        <PartOfSpeechBars data={v.byPartOfSpeech} labels={PART_OF_SPEECH_LABEL} />
      </div>
      <div className="pt-3 border-t-2 border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Từ mới gần đây
          </p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            +{v.addedLast30Days} trong 30 ngày
          </p>
        </div>
        <div className="space-y-1.5">
          {v.recentlyAdded.length === 0 ? (
            <p className="text-xs text-muted-foreground">Chưa có từ vựng nào</p>
          ) : (
            v.recentlyAdded.slice(0, 5).map((row) => <RecentVocabRow key={row.id} row={row} />)
          )}
        </div>
      </div>
    </div>
  )
}

function RecentVocabRow({ row }: { row: RecentVocabulary }) {
  const SourceIcon =
    row.source === 'image' ? ImageIcon : row.source === 'manual' ? User2 : BookMarked
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        <SourceIcon className="h-3 w-3 text-muted-foreground shrink-0" />
        <p className="text-sm font-bold text-foreground truncate flex-1">{row.word}</p>
        <p className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
          {formatRelative(row.createdAt)}
        </p>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-1 ml-5 mt-0.5">
        {row.translation}
      </p>
    </div>
  )
}

// ─── Course progress ────────────────────────────────────────────────────────
function CourseProgressList({ rows }: { rows: CourseProgressRow[] }) {
  if (rows.length === 0) {
    return <EmptyChart message="Chưa đăng ký khóa học nào" icon={GraduationCap} />
  }
  return (
    <div className="space-y-2.5">
      {rows.map((row) => {
        const pct = Math.round(row.completion * 100)
        const levelTint = LEVEL_COLOR[row.level] ?? INDIGO
        return (
          <div
            key={row.courseId}
            className="rounded-lg border-2 border-border bg-card p-3.5"
          >
            <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">
                  {row.title}
                </p>
                <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px]">
                  <span
                    className="inline-flex items-center rounded-md px-1.5 py-0.5 font-bold text-white"
                    style={{ backgroundColor: levelTint }}
                  >
                    {row.level}
                  </span>
                  <span className="text-muted-foreground">
                    {row.completedLessons}/{row.totalLessons} bài
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(row.timeSpent)}
                  </span>
                  {row.lastAccessedAt && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">
                        Cuối: {formatRelative(row.lastAccessedAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold tabular-nums leading-none">{pct}<span className="text-base text-muted-foreground">%</span></p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: pct === 100 ? EMERALD : INDIGO,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Conversations list ────────────────────────────────────────────────────
function ConversationsList({
  data,
  learnerId,
  onNavigate,
}: {
  data: LearnerAnalytics['aiUsage']['conversations']
  learnerId: string
  onNavigate: (path: string) => void
}) {
  if (data.total === 0) {
    return <EmptyChart message="Chưa có hội thoại AI nào" icon={Bot} />
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Tổng phiên" value={formatNumber(data.total)} />
        <Stat label="TB tin/phiên" value={`${data.avgMessages}`} />
        <Stat label="TB token/phiên" value={formatCompact(data.avgTokensPerSession)} />
      </div>
      <div className="space-y-2 pt-2 border-t-2 border-border">
        {data.recent.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onNavigate(learnerPath.conversation(learnerId, row.id))}
            className="w-full flex items-start gap-3 rounded-lg border-2 border-border bg-card p-3 text-left transition-colors hover:border-primary"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground line-clamp-1">
                {row.title}
              </p>
              {(row.courseTitle || row.lessonTitle) && (
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {[row.courseTitle, row.lessonTitle].filter(Boolean).join(' › ')}
                </p>
              )}
              <div className="mt-1 flex items-center gap-x-3 gap-y-0.5 flex-wrap text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {row.messageCount} tin
                </span>
                <span>· {formatCompact(row.totalTokens)} tokens</span>
                <span>· {formatRelative(row.updatedAt)}</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Simulations block ─────────────────────────────────────────────────────
function SimulationsBlock({
  data,
  learnerId,
  onNavigate,
}: {
  data: LearnerAnalytics['aiUsage']['simulations']
  learnerId: string
  onNavigate: (path: string) => void
}) {
  if (data.total === 0) {
    return <EmptyChart message="Chưa có phiên mô phỏng nào" icon={MessageCircle} />
  }
  const criteriaMax = Math.max(...data.criteriaAverages.map((c) => c.maxScore || 100), 100)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Tổng" value={formatNumber(data.total)} />
        <Stat label="Đã xong" value={formatNumber(data.completed)} />
        <Stat label="Điểm TB" value={data.avgScore != null ? String(data.avgScore) : '—'} />
        <Stat label="Token" value={formatCompact(data.totalTokens)} />
      </div>

      {data.criteriaAverages.length > 0 && (
        <div className="pt-2 border-t-2 border-border">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Điểm trung bình theo tiêu chí
          </p>
          <div className="space-y-2">
            {data.criteriaAverages.map((row) => {
              const ratio = row.maxScore > 0 ? row.avgScore / row.maxScore : 0
              const color = ratio >= 0.8 ? EMERALD : ratio >= 0.6 ? CYAN : ratio >= 0.4 ? AMBER : ROSE
              return (
                <div key={row.name}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-semibold text-foreground">{row.name}</span>
                    <span className="text-muted-foreground tabular-nums">
                      <span className="font-bold text-foreground">{row.avgScore.toFixed(1)}</span> / {row.maxScore || criteriaMax} · {row.samples} mẫu
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, ratio * 100)}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="pt-2 border-t-2 border-border space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Phiên gần đây
        </p>
        {data.recent.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onNavigate(learnerPath.simulation(learnerId, row.id))}
            className="w-full flex items-start gap-3 rounded-lg border-2 border-border bg-card p-3 text-left transition-colors hover:border-primary"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground line-clamp-1">
                {row.scenarioTitle}
              </p>
              <div className="mt-0.5 flex items-center gap-x-2 gap-y-0.5 flex-wrap text-[11px] text-muted-foreground">
                {row.characterName && <span>Vai: {row.characterName}</span>}
                <span>· {row.messageCount} tin</span>
                <span>· {formatRelative(row.updatedAt)}</span>
              </div>
            </div>
            <div className="text-right shrink-0 self-center">
              {row.totalScore != null ? (
                <p className="text-xl font-bold tabular-nums leading-none">
                  {row.totalScore}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">—</p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Mute unused warning ────────────────────────────────────────────────────
void TrendingUp
void TrendingDown
void QUESTION_TYPE_LABEL
