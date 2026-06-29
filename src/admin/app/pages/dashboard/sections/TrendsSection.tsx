import { useMemo, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Skeleton } from '../../../components/ui/skeleton'
import { ErrorState } from '../../../components/admin/ErrorState'
import {
  useDashboardActivity,
  type ActivityWindow,
} from '../../../features/dashboard'
import {
  CYAN,
  EmptyState,
  formatDateShort,
  formatNumber,
  formatPercent,
  GREEN,
  INDIGO,
  SectionCard,
  TEAL,
  VIOLET,
} from './dashboard-ui'

const WINDOW_OPTIONS: { value: ActivityWindow; label: string }[] = [
  { value: 7, label: '7 ngày' },
  { value: 30, label: '30 ngày' },
  { value: 90, label: '90 ngày' },
]

const SERIES_NAMES: Record<string, string> = {
  questionAttempts: 'Lượt trả lời',
  lessonsCompleted: 'Bài hoàn thành',
  simulationsCompleted: 'Mô phỏng',
  aiConversations: 'Hội thoại AI',
}

/** Xu hướng hoạt động: chart đa chuỗi theo cửa sổ ngày. */
export function TrendsSection() {
  const [days, setDays] = useState<ActivityWindow>(30)
  const { data, isLoading, isError, error, refetch, isFetching } =
    useDashboardActivity(days)

  const chartData = useMemo(
    () =>
      (data?.series ?? []).map((point) => ({
        ...point,
        label: formatDateShort(point.date),
      })),
    [data?.series],
  )

  const totalSimulations = useMemo(
    () => (data?.series ?? []).reduce((sum, p) => sum + p.simulationsCompleted, 0),
    [data?.series],
  )

  const totalConversations = useMemo(
    () => (data?.series ?? []).reduce((sum, p) => sum + p.aiConversations, 0),
    [data?.series],
  )

  const windowPicker = (
    <div className="inline-flex items-center rounded-full border-2 border-border bg-muted/40 p-1 gap-1">
      {WINDOW_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setDays(option.value)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            days === option.value
              ? 'bg-primary text-primary-foreground font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-card'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )

  return (
    <SectionCard
      title="Xu hướng hoạt động"
      hint="Theo ngày lịch Việt Nam — lượt trả lời, bài học hoàn thành và phiên AI"
      icon={TrendingUp}
      iconTint={INDIGO}
      actions={windowPicker}
    >
      {isError ? (
        <ErrorState
          title="Không tải được xu hướng hoạt động"
          message={error instanceof Error ? error.message : 'Lỗi không xác định'}
          onRetry={() => refetch()}
          retrying={isFetching}
          size="sm"
        />
      ) : isLoading || !data ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <WindowTotal
              label="Lượt trả lời"
              value={data.totals.questionAttempts}
              tint={CYAN}
            />
            <WindowTotal
              label="Bài hoàn thành"
              value={data.totals.lessonsCompleted}
              tint={GREEN}
            />
            <WindowTotal
              label="Mô phỏng"
              value={totalSimulations}
              tint={VIOLET}
            />
            <WindowTotal
              label="Hội thoại AI"
              value={totalConversations}
              tint={TEAL}
            />
          </div>

          {chartData.length === 0 ? (
            <EmptyState message="Chưa có hoạt động trong khoảng thời gian này" />
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
                >
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                    interval="preserveStartEnd"
                    minTickGap={28}
                  />
                  <YAxis
                    yAxisId="counts"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis yAxisId="attempts" orientation="right" hide />
                  <Tooltip content={<TrendsTooltip />} cursor={{ stroke: 'var(--border)' }} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    iconType="circle"
                    formatter={(value) => (
                      <span style={{ color: 'var(--foreground)' }}>
                        {SERIES_NAMES[value as string] ?? value}
                      </span>
                    )}
                  />
                  <Area
                    yAxisId="attempts"
                    type="monotone"
                    dataKey="questionAttempts"
                    stroke={CYAN}
                    strokeWidth={2}
                    fill={CYAN}
                    fillOpacity={0.12}
                  />
                  <Line
                    yAxisId="counts"
                    type="monotone"
                    dataKey="lessonsCompleted"
                    stroke={GREEN}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="counts"
                    type="monotone"
                    dataKey="simulationsCompleted"
                    stroke={VIOLET}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="counts"
                    type="monotone"
                    dataKey="aiConversations"
                    stroke={TEAL}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  )
}

function WindowTotal({
  label,
  value,
  tint,
  hint,
}: {
  label: string
  value: number
  tint: string
  hint?: string
}) {
  return (
    <div className="rounded-lg border-2 border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tint }} />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">
        {formatNumber(value)}
      </p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

interface TooltipEntry {
  dataKey?: string | number
  value?: number | string
  color?: string
  payload?: { accuracy: number | null }
}

function TrendsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const accuracy = payload[0]?.payload?.accuracy
  return (
    <div className="rounded-lg border-2 border-border bg-card px-3.5 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 space-y-1">
        {payload.map((entry) => (
          <div key={String(entry.dataKey)} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {SERIES_NAMES[String(entry.dataKey)] ?? String(entry.dataKey)}
            </span>
            <span className="ml-auto font-bold tabular-nums">
              {formatNumber(Number(entry.value))}
            </span>
          </div>
        ))}
        {accuracy != null && (
          <div className="flex items-center gap-2 border-t-2 border-border pt-1.5 text-sm">
            <span className="text-muted-foreground">Độ chính xác</span>
            <span className="ml-auto font-bold tabular-nums">
              {formatPercent(accuracy)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
