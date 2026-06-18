import type { ComponentType } from 'react'
import { BookOpenCheck, Bot, ListChecks } from 'lucide-react'
import { Skeleton } from '../../../components/ui/skeleton'
import { ErrorState } from '../../../components/admin/ErrorState'
import {
  useDashboardPulse,
  type PulseMetric,
  type SystemTotals,
} from '../../../features/dashboard'
import {
  CYAN,
  DeltaBadge,
  formatNumber,
  formatPercent,
  GREEN,
  Sparkline,
  TEAL,
} from './dashboard-ui'

export function PulseSection() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useDashboardPulse()

  if (isError) {
    return (
      <ErrorState
        title="Khong tai duoc nhip dap hom nay"
        message={error instanceof Error ? error.message : 'Loi khong xac dinh'}
        onRetry={() => refetch()}
        retrying={isFetching}
        size="sm"
      />
    )
  }

  const accuracyHint = data
    ? data.questionAttempts.accuracyToday == null
      ? 'Chua co luot lam hom nay'
      : data.questionAttempts.accuracyYesterday == null
        ? `Dung ${formatPercent(data.questionAttempts.accuracyToday)}`
        : `Dung ${formatPercent(data.questionAttempts.accuracyToday)} - hom qua ${formatPercent(
            data.questionAttempts.accuracyYesterday,
          )}`
    : undefined

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <PulseTile
          label="Luot tra loi cau hoi"
          metric={data?.questionAttempts}
          icon={ListChecks}
          tint={CYAN}
          hint={accuracyHint}
          loading={isLoading}
        />
        <PulseTile
          label="Bai hoc hoan thanh"
          metric={data?.lessonsCompleted}
          icon={BookOpenCheck}
          tint={GREEN}
          hint="So bai hoc duoc hoan thanh trong hom nay"
          loading={isLoading}
        />
        <PulseTile
          label="Phien AI moi"
          metric={data?.aiSessions}
          icon={Bot}
          tint={TEAL}
          hint="Mo phong bat dau + hoi thoai tao moi"
          loading={isLoading}
        />
      </div>

      <TotalsStrip totals={data?.totals} loading={isLoading} />
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
}: {
  label: string
  metric?: PulseMetric
  icon: ComponentType<{ className?: string }>
  tint: string
  hint?: string
  loading: boolean
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
          {hint && (
            <p className="mt-1.5 text-xs text-muted-foreground truncate">
              {hint}
            </p>
          )}
          <div className="mt-3">
            <Sparkline points={metric.series} color={tint} />
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              14 ngay gan nhat
            </p>
          </div>
        </>
      )}
    </div>
  )
}

const TOTAL_ITEMS: {
  key: keyof SystemTotals
  label: string
}[] = [
  { key: 'courses', label: 'Khoa hoc' },
  { key: 'lessons', label: 'Bai hoc' },
  { key: 'questions', label: 'Cau hoi' },
  { key: 'vocabularies', label: 'Tu vung' },
  { key: 'simulations', label: 'Phien mo phong' },
  { key: 'conversations', label: 'Hoi thoai AI' },
]

function TotalsStrip({
  totals,
  loading,
}: {
  totals?: SystemTotals
  loading: boolean
}) {
  if (loading || !totals) {
    return <Skeleton className="h-20 w-full" />
  }

  return (
    <div className="rounded-xl border-2 border-border bg-card px-2 py-4">
      <div className="flex flex-wrap items-stretch divide-x-2 divide-border">
        {TOTAL_ITEMS.map((item) => (
          <div key={item.key} className="flex-1 min-w-28 px-4 py-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              {item.label}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums tracking-tight">
              {formatNumber(totals[item.key])}
            </p>
            {item.key === 'courses' && (
              <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                {formatNumber(totals.publishedCourses)} da xuat ban
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
