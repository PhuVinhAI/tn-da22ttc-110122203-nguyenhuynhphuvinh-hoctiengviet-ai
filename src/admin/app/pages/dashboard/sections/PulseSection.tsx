import type { ComponentType } from 'react'
import { BookOpen, BookOpenCheck, Bot, HelpCircle, ListChecks, MessageSquare, Sparkles } from 'lucide-react'
import { Skeleton } from '../../../components/ui/skeleton'
import { ErrorState } from '../../../components/admin/ErrorState'
import {
  useDashboardPulse,
  type PulseMetric,
  type SystemTotals,
} from '../../../features/dashboard'
import {
  AMBER,
  BLUE,
  CYAN,
  DeltaBadge,
  formatNumber,
  formatPercent,
  GREEN,
  MiniStatCard,
  Sparkline,
  TEAL,
  VIOLET,
} from './dashboard-ui'

export function PulseSection() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useDashboardPulse()

  if (isError) {
    return (
      <ErrorState
        title="Không tải được nhịp đập hôm nay"
        message={error instanceof Error ? error.message : 'Lỗi không xác định'}
        onRetry={() => refetch()}
        retrying={isFetching}
        size="sm"
      />
    )
  }

  const accuracy = data?.questionAttempts.accuracyToday
  const accuracyYesterday = data?.questionAttempts.accuracyYesterday

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <PulseTile
          label="Lượt trả lời câu hỏi"
          metric={data?.questionAttempts}
          icon={ListChecks}
          tint={CYAN}
          loading={isLoading}
          accuracy={accuracy}
          accuracyYesterday={accuracyYesterday}
        />
        <PulseTile
          label="Bài học hoàn thành"
          metric={data?.lessonsCompleted}
          icon={BookOpenCheck}
          tint={GREEN}
          hint="Số bài học được hoàn thành trong hôm nay"
          loading={isLoading}
        />
        <PulseTile
          label="Phiên AI mới"
          metric={data?.aiSessions}
          icon={Bot}
          tint={TEAL}
          hint="Mô phỏng bắt đầu + hội thoại tạo mới"
          loading={isLoading}
        />
      </div>

      <TotalsGrid totals={data?.totals} loading={isLoading} />
    </div>
  )
}

function PulseTile({
  label,
  metric,
  icon: Icon,
  tint,
  hint,
  loading,
  accuracy,
  accuracyYesterday,
}: {
  label: string
  metric?: PulseMetric
  icon: ComponentType<{ className?: string }>
  tint: string
  hint?: string
  loading: boolean
  accuracy?: number | null
  accuracyYesterday?: number | null
}) {
  return (
    <div className="rounded-xl border-2 border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${tint}1F`, color: tint }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {loading || !metric ? (
        <>
          <Skeleton className="mt-2 h-9 w-24" />
          <Skeleton className="mt-2 h-3 w-36" />
          <Skeleton className="mt-3 h-9 w-full" />
        </>
      ) : (
        <>
          <div className="mt-1 flex items-center gap-2.5">
            <span className="text-3xl font-bold tracking-tight tabular-nums">
              {formatNumber(metric.today)}
            </span>
            <DeltaBadge today={metric.today} yesterday={metric.yesterday} />
          </div>
          {accuracy != null ? (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Đúng {formatPercent(accuracy)}
              {accuracyYesterday != null && (
                <span className="ml-1.5">— hôm qua {formatPercent(accuracyYesterday)}</span>
              )}
            </p>
          ) : hint ? (
            <p className="mt-1.5 text-xs text-muted-foreground truncate">
              {hint}
            </p>
          ) : null}
          <div className="mt-3">
            <Sparkline points={metric.series} color={tint} />
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              14 ngày gần nhất
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export function TotalsGrid({
  totals,
  loading,
}: {
  totals?: SystemTotals
  loading: boolean
}) {
  if (loading || !totals) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <MiniStatCard
        label="Khóa học"
        value={formatNumber(totals.courses)}
        icon={BookOpen}
        tint={BLUE}
        subtitle={`${formatNumber(totals.publishedCourses)} đã xuất bản`}
      />
      <MiniStatCard
        label="Bài học"
        value={formatNumber(totals.lessons)}
        icon={BookOpenCheck}
        tint={GREEN}
      />
      <MiniStatCard
        label="Câu hỏi"
        value={formatNumber(totals.questions)}
        icon={HelpCircle}
        tint={VIOLET}
      />
      <MiniStatCard
        label="Từ vựng"
        value={formatNumber(totals.vocabularies)}
        icon={Sparkles}
        tint={AMBER}
      />
    </div>
  )
}
