import { useMemo, useState } from 'react'
import { CalendarClock, TrendingUp } from 'lucide-react'
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
  type HeatmapCell,
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
} from './dashboard-ui'

const WINDOW_OPTIONS: { value: ActivityWindow; label: string }[] = [
  { value: 7, label: '7 ngày' },
  { value: 30, label: '30 ngày' },
  { value: 90, label: '90 ngày' },
]

const SERIES_NAMES: Record<string, string> = {
  questionAttempts: 'Lượt trả lời',
  lessonsCompleted: 'Bài học hoàn thành',
}

/** Xu hướng hoạt động: chart đa chuỗi theo cửa sổ ngày + heatmap giờ học. */
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
      hint="Theo ngay lich Viet Nam - luot tra loi, bai hoc hoan thanh va phien AI"
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
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <WindowTotal
              label="Lượt trả lời"
              value={data.totals.questionAttempts}
              tint={CYAN}
            />
            <WindowTotal
              label="Bài học hoàn thành"
              value={data.totals.lessonsCompleted}
              tint={GREEN}
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
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          <PeakHoursHeatmap cells={data.heatmap} days={data.days} />
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

// ─── Heatmap giờ học cao điểm ────────────────────────────────────────────────

/** Thứ tự hàng: T2 → CN; backend trả DOW Postgres (0 = Chủ nhật). */
const WEEKDAY_ROWS = [1, 2, 3, 4, 5, 6, 0]
const WEEKDAY_LABEL: Record<number, string> = {
  0: 'CN',
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
}
const HOURS = Array.from({ length: 24 }, (_, h) => h)

function PeakHoursHeatmap({ cells, days }: { cells: HeatmapCell[]; days: number }) {
  const { grid, max, peak } = useMemo(() => {
    const grid = new Map<string, number>()
    let max = 0
    let peak: HeatmapCell | null = null
    for (const cell of cells) {
      grid.set(`${cell.weekday}:${cell.hour}`, cell.count)
      if (cell.count > max) {
        max = cell.count
        peak = cell
      }
    }
    return { grid, max, peak }
  }, [cells])

  return (
    <div className="rounded-lg border-2 border-border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold">Giờ học cao điểm</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {peak
            ? `Đỉnh: ${WEEKDAY_LABEL[peak.weekday]} ${String(peak.hour).padStart(2, '0')}h — ${formatNumber(peak.count)} lượt trả lời`
            : `Chưa có lượt trả lời trong ${days} ngày`}
        </p>
      </div>

      {max > 0 && (
        <div className="mt-3 overflow-x-auto">
          <div className="min-w-[640px]">
            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: `2.25rem repeat(24, minmax(0, 1fr))` }}
            >
              <div />
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="text-center text-[9px] font-bold text-muted-foreground tabular-nums"
                >
                  {hour % 3 === 0 ? hour : ''}
                </div>
              ))}
              {WEEKDAY_ROWS.map((weekday) => (
                <HeatmapRow
                  key={weekday}
                  weekday={weekday}
                  grid={grid}
                  max={max}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HeatmapRow({
  weekday,
  grid,
  max,
}: {
  weekday: number
  grid: Map<string, number>
  max: number
}) {
  return (
    <>
      <div className="flex items-center text-[10px] font-bold text-muted-foreground">
        {WEEKDAY_LABEL[weekday]}
      </div>
      {HOURS.map((hour) => {
        const count = grid.get(`${weekday}:${hour}`) ?? 0
        const intensity = count === 0 ? 0 : 0.15 + 0.85 * (count / max)
        return (
          <div
            key={hour}
            className="aspect-square rounded-[3px] border border-border/60"
            style={{
              backgroundColor:
                count === 0 ? 'var(--muted)' : INDIGO,
              opacity: count === 0 ? 0.4 : intensity,
            }}
            title={`${WEEKDAY_LABEL[weekday]} ${String(hour).padStart(2, '0')}h: ${formatNumber(count)} lượt trả lời`}
          />
        )
      })}
    </>
  )
}
