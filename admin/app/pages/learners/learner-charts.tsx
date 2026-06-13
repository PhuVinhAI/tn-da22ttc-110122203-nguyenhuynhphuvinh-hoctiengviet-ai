import { useMemo } from 'react'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  ActivityCalendar,
  DifficultyEntry,
  GoalDailyEntry,
  HourHeatmapCell,
  SkillRadarEntry,
  SpeedBucket,
  TrendPoint,
  VocabularyByPos,
} from '../../features/learners/types'
import {
  AMBER,
  CYAN,
  EmptyChart,
  formatDateShort,
  formatNumber,
  formatPercent,
  GREEN,
  INDIGO,
  QUESTION_TYPE_LABEL,
  ROSE,
  VIOLET,
} from './learner-ui'

// ─── Chú giải nhỏ ───────────────────────────────────────────────────────────
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

// ─── 1. Activity calendar (GitHub-style heatmap 91 ngày) ────────────────────
const TIER_COLORS = ['var(--muted)', '#bbf7d0', '#86efac', '#22c55e', '#15803d'] as const

const VN_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

interface ActivityCalendarChartProps {
  calendar: ActivityCalendar
}

export function ActivityCalendarChart({ calendar }: ActivityCalendarChartProps) {
  const weeks = useMemo(() => {
    if (calendar.days.length === 0) return [] as Array<typeof calendar.days>
    const first = calendar.days[0]
    const firstDate = new Date(`${first.date}T00:00:00Z`)
    const firstDow = firstDate.getUTCDay() // 0=CN
    const cols: Array<typeof calendar.days> = []
    let column: typeof calendar.days = []
    for (let i = 0; i < firstDow; i++) {
      column.push({ date: `pad-${i}`, value: -1, tier: 0 })
    }
    for (const day of calendar.days) {
      column.push(day)
      if (column.length === 7) {
        cols.push(column)
        column = []
      }
    }
    if (column.length > 0) {
      while (column.length < 7) {
        column.push({ date: `tail-${column.length}`, value: -1, tier: 0 })
      }
      cols.push(column)
    }
    return cols
  }, [calendar.days])

  if (calendar.max === 0) {
    return <EmptyChart message="Chưa có hoạt động trong 90 ngày qua" />
  }

  return (
    <div>
      <div className="flex gap-[3px]">
        <div className="flex flex-col gap-[3px] pt-[2px] pr-1 text-[9px] font-bold text-muted-foreground">
          {VN_WEEKDAYS.map((label, i) => (
            <div key={label} className="h-[14px] leading-[14px]">
              {i % 2 === 0 ? label : ''}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px] overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => {
                if (day.value < 0) {
                  return <div key={day.date} className="h-[14px] w-[14px]" />
                }
                return (
                  <div
                    key={day.date}
                    className="h-[14px] w-[14px] rounded-[3px]"
                    style={{ backgroundColor: TIER_COLORS[day.tier] }}
                    title={`${day.date} · ${day.value} hoạt động`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between flex-wrap gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>Hoạt động: <span className="font-bold text-foreground tabular-nums">{calendar.totalActiveDays}</span>/{calendar.windowDays} ngày</span>
          <span>Chuỗi dài nhất: <span className="font-bold text-foreground tabular-nums">{calendar.longestActiveRun}</span> ngày</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Ít</span>
          {TIER_COLORS.map((color, i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-[3px]"
              style={{ backgroundColor: color }}
            />
          ))}
          <span>Nhiều</span>
        </div>
      </div>
    </div>
  )
}

// ─── 2. Hour heatmap (DOW × Hour) ───────────────────────────────────────────
const WEEKDAY_ROWS = [1, 2, 3, 4, 5, 6, 0]
const WEEKDAY_LABEL: Record<number, string> = {
  0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7',
}
const HOURS = Array.from({ length: 24 }, (_, h) => h)

export function HourHeatmap({ cells }: { cells: HourHeatmapCell[] }) {
  const { grid, max, peak } = useMemo(() => {
    const grid = new Map<string, number>()
    let max = 0
    let peak: HourHeatmapCell | null = null
    for (const cell of cells) {
      grid.set(`${cell.weekday}:${cell.hour}`, cell.count)
      if (cell.count > max) {
        max = cell.count
        peak = cell
      }
    }
    return { grid, max, peak }
  }, [cells])

  if (max === 0) {
    return <EmptyChart message="Chưa đủ dữ liệu để vẽ giờ học cao điểm" />
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        {peak && `Học nhiều nhất vào ${WEEKDAY_LABEL[peak.weekday]} lúc ${String(peak.hour).padStart(2, '0')}h — ${formatNumber(peak.count)} lượt`}
      </p>
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div
            className="grid gap-[3px]"
            style={{ gridTemplateColumns: '2.25rem repeat(24, minmax(0, 1fr))' }}
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
              <Row key={weekday} weekday={weekday} grid={grid} max={max} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
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
      <div className="text-[10px] font-bold text-muted-foreground self-center text-right pr-1.5">
        {WEEKDAY_LABEL[weekday]}
      </div>
      {HOURS.map((hour) => {
        const count = grid.get(`${weekday}:${hour}`) ?? 0
        const opacity = count === 0 ? 0 : 0.18 + (count / max) * 0.82
        return (
          <div
            key={hour}
            className="h-5 rounded-[3px] border border-border/40"
            style={{
              backgroundColor: count === 0 ? 'transparent' : INDIGO,
              opacity: count === 0 ? 1 : opacity,
            }}
            title={`${WEEKDAY_LABEL[weekday]} ${String(hour).padStart(2, '0')}h — ${count} lượt`}
          />
        )
      })}
    </>
  )
}

// ─── 3. Trend chart (line + area) ───────────────────────────────────────────
interface TrendsTooltipPayload {
  dataKey?: string | number
  value?: number | string
  color?: string
  payload?: TrendPoint & { label?: string }
}

export function TrendsChart({ series }: { series: TrendPoint[] }) {
  const chartData = useMemo(
    () => series.map((p) => ({ ...p, label: formatDateShort(p.date) })),
    [series],
  )
  if (chartData.length === 0) {
    return <EmptyChart message="Chưa có dữ liệu xu hướng" />
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <LegendDot color={CYAN} label="Lượt trả lời" />
        <LegendDot color={INDIGO} label="Bài học hoàn thành" />
        <LegendDot color={GREEN} label="Từ mới lưu" />
        <LegendDot color={VIOLET} label="Tin AI" />
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
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
            <Area
              yAxisId="attempts"
              type="monotone"
              dataKey="attempts"
              stroke={CYAN}
              strokeWidth={2}
              fill={CYAN}
              fillOpacity={0.12}
            />
            <Line yAxisId="counts" type="monotone" dataKey="lessonsCompleted" stroke={INDIGO} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line yAxisId="counts" type="monotone" dataKey="vocabularyAdded" stroke={GREEN} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line yAxisId="counts" type="monotone" dataKey="aiMessages" stroke={VIOLET} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TrendsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TrendsTooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as TrendPoint | undefined
  return (
    <div className="rounded-lg border-2 border-border bg-card px-3.5 py-3 space-y-1.5">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <Row2 label="Lượt trả lời" value={point?.attempts ?? 0} color={CYAN} />
      <Row2 label="Bài học HT" value={point?.lessonsCompleted ?? 0} color={INDIGO} />
      <Row2 label="Từ mới" value={point?.vocabularyAdded ?? 0} color={GREEN} />
      <Row2 label="Tin AI" value={point?.aiMessages ?? 0} color={VIOLET} />
      <div className="border-t border-border pt-1.5 text-xs text-muted-foreground flex items-center justify-between">
        <span>Độ chính xác</span>
        <span className="font-bold text-foreground">{formatPercent(point?.accuracy ?? null)}</span>
      </div>
      <div className="text-xs text-muted-foreground flex items-center justify-between">
        <span>Thời lượng</span>
        <span className="font-bold text-foreground">{point?.activeMinutes ?? 0} phút</span>
      </div>
    </div>
  )
}

function Row2({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-bold tabular-nums">{formatNumber(value)}</span>
    </div>
  )
}

// ─── 4. Skill radar ─────────────────────────────────────────────────────────
export function SkillRadarChart({ data }: { data: SkillRadarEntry[] }) {
  const chartData = useMemo(
    () =>
      data.map((row) => ({
        skill: QUESTION_TYPE_LABEL[row.questionType] ?? row.questionType,
        accuracy: Math.round((row.attempts > 0 ? row.accuracy : 0) * 100),
        attempts: row.attempts,
      })),
    [data],
  )
  const hasData = data.some((row) => row.attempts > 0)
  if (!hasData) {
    return <EmptyChart message="Chưa thử bài tập nào để đo kỹ năng" />
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            tickFormatter={(v) => `${v}%`}
            stroke="var(--border)"
          />
          <Radar
            name="Độ chính xác"
            dataKey="accuracy"
            stroke={INDIGO}
            fill={INDIGO}
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip content={<RadarTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { skill: string; accuracy: number; attempts: number } }>
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border-2 border-border bg-card px-3.5 py-2.5">
      <p className="text-sm font-bold">{data.skill}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Độ chính xác: <span className="font-bold text-foreground">{data.accuracy}%</span>
      </p>
      <p className="text-xs text-muted-foreground">
        Số lần làm: <span className="font-bold text-foreground tabular-nums">{data.attempts}</span>
      </p>
    </div>
  )
}

// ─── 5. Difficulty breakdown ────────────────────────────────────────────────
const DIFFICULTY_LABELS = ['', 'Rất dễ', 'Dễ', 'Trung bình', 'Khó', 'Rất khó']
const DIFFICULTY_COLORS = ['', GREEN, CYAN, AMBER, ROSE, VIOLET]

export function DifficultyChart({ data }: { data: DifficultyEntry[] }) {
  const chartData = useMemo(
    () =>
      data.map((row) => ({
        label: DIFFICULTY_LABELS[row.difficulty] ?? `Mức ${row.difficulty}`,
        difficulty: row.difficulty,
        attempts: row.attempts,
        correct: row.correct,
        accuracy: Math.round(row.accuracy * 100),
        wrong: row.attempts - row.correct,
        color: DIFFICULTY_COLORS[row.difficulty] ?? INDIGO,
      })),
    [data],
  )
  const totalAttempts = chartData.reduce((s, r) => s + r.attempts, 0)
  if (totalAttempts === 0) {
    return <EmptyChart message="Chưa có dữ liệu độ khó" />
  }
  return (
    <div className="space-y-3">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as (typeof chartData)[number]
                return (
                  <div className="rounded-lg border-2 border-border bg-card px-3.5 py-2.5 space-y-1">
                    <p className="text-sm font-bold">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      Đúng <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{row.correct}</span> / <span className="font-bold tabular-nums">{row.attempts}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Độ chính xác: <span className="font-bold text-foreground">{row.accuracy}%</span>
                    </p>
                  </div>
                )
              }}
              cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
            />
            <Bar dataKey="correct" stackId="a" fill={GREEN} />
            <Bar dataKey="wrong" stackId="a" fill={ROSE} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-3">
        <LegendDot color={GREEN} label="Đúng" />
        <LegendDot color={ROSE} label="Sai" />
      </div>
    </div>
  )
}

// ─── 6. Speed histogram ─────────────────────────────────────────────────────
export function SpeedHistogramChart({ data }: { data: SpeedBucket[] }) {
  const chartData = data.filter((row) => row.count > 0).map((row) => ({
    ...row,
    accuracy: Math.round(row.correctRate * 100),
  }))
  if (chartData.length === 0) {
    return <EmptyChart message="Chưa có dữ liệu thời gian làm bài" />
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="bucket"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as (typeof chartData)[number]
              return (
                <div className="rounded-lg border-2 border-border bg-card px-3.5 py-2.5 space-y-1">
                  <p className="text-sm font-bold">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    Số lượt: <span className="font-bold tabular-nums">{row.count}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tỷ lệ đúng: <span className="font-bold text-foreground">{row.accuracy}%</span>
                  </p>
                </div>
              )
            }}
            cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
          />
          <Bar dataKey="count" fill={INDIGO} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── 7. Donut chart (vocab source / pos) ────────────────────────────────────
interface DonutSlice {
  label: string
  value: number
  color: string
}

export function DonutChart({
  slices,
  totalLabel,
  totalValue,
}: {
  slices: DonutSlice[]
  totalLabel: string
  totalValue: number
}) {
  const safeSlices = slices.filter((s) => s.value > 0)
  if (safeSlices.length === 0) {
    return <EmptyChart message="Chưa có dữ liệu" />
  }
  const total = safeSlices.reduce((s, item) => s + item.value, 0)
  const radius = 60
  const stroke = 18
  const circ = 2 * Math.PI * radius
  let acc = 0
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
          <circle
            cx={80}
            cy={80}
            r={radius}
            fill="transparent"
            stroke="var(--muted)"
            strokeWidth={stroke}
          />
          {safeSlices.map((slice, idx) => {
            const length = (slice.value / total) * circ
            const dash = `${length} ${circ - length}`
            const offset = -acc
            acc += length
            return (
              <circle
                key={idx}
                cx={80}
                cy={80}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={stroke}
                strokeDasharray={dash}
                strokeDashoffset={offset}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {totalLabel}
          </p>
          <p className="text-2xl font-bold tabular-nums leading-none mt-1">
            {formatNumber(totalValue)}
          </p>
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        {safeSlices.map((slice) => {
          const pct = (slice.value / total) * 100
          return (
            <div key={slice.label} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-muted-foreground truncate">{slice.label}</span>
              <span className="ml-auto font-bold tabular-nums">{slice.value}</span>
              <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                {pct.toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── 8. Goals 30-day strip ──────────────────────────────────────────────────
export function GoalsStrip({
  days,
  goalCompletionRate,
}: {
  days: GoalDailyEntry[]
  goalCompletionRate: number
}) {
  if (days.length === 0) {
    return <EmptyChart message="Chưa có dữ liệu mục tiêu" />
  }
  return (
    <div>
      <div className="flex items-end gap-1.5 mb-3">
        <p className="text-4xl font-bold tabular-nums tracking-tight">
          {Math.round(goalCompletionRate * 100)}<span className="text-base text-muted-foreground">%</span>
        </p>
        <p className="text-sm text-muted-foreground pb-1.5">đạt mục tiêu trong 30 ngày</p>
      </div>
      <div className="grid grid-cols-30 gap-[3px]" style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}>
        {days.map((day) => (
          <div
            key={day.date}
            className="h-7 rounded-[3px] border border-border/40"
            style={{
              backgroundColor: day.met
                ? GREEN
                : day.questions + day.lessons > 0
                  ? AMBER
                  : 'var(--muted)',
              opacity: day.met ? 0.9 : day.questions + day.lessons > 0 ? 0.55 : 1,
            }}
            title={`${day.date} · ${day.questions} câu, ${day.lessons} bài học`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs">
        <LegendDot color={GREEN} label="Đạt mục tiêu" />
        <LegendDot color={AMBER} label="Có học, chưa đủ" />
        <LegendDot color="var(--muted)" label="Không học" />
      </div>
    </div>
  )
}

// ─── 9. Skill bars (alt cho radar khi cần list) ─────────────────────────────
export function SkillBarsCompact({ data }: { data: SkillRadarEntry[] }) {
  const rows = data.filter((row) => row.attempts > 0)
  if (rows.length === 0) {
    return <EmptyChart message="Chưa có dữ liệu kỹ năng" />
  }
  return (
    <div className="space-y-2.5">
      {rows.map((row) => {
        const pct = Math.round(row.accuracy * 100)
        const color =
          row.strength === 'strong'
            ? GREEN
            : row.strength === 'weak'
              ? ROSE
              : row.strength === 'average'
                ? CYAN
                : '#94A3B8'
        return (
          <div key={row.questionType}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-foreground">
                {QUESTION_TYPE_LABEL[row.questionType] ?? row.questionType}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                <span className="font-bold text-foreground">{pct}%</span> · {row.attempts} lần
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── 10. Vocabulary part-of-speech bars ─────────────────────────────────────
export function PartOfSpeechBars({
  data,
  labels,
}: {
  data: VocabularyByPos[]
  labels: Record<string, string>
}) {
  if (data.length === 0) {
    return <EmptyChart message="Chưa có dữ liệu từ loại" />
  }
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="space-y-2.5">
      {data.map((row) => {
        const pct = (row.count / max) * 100
        return (
          <div key={row.partOfSpeech}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground">
                {labels[row.partOfSpeech] ?? row.partOfSpeech}
              </span>
              <span className="text-xs font-bold tabular-nums">{row.count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: VIOLET }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── 11. Hidden legend exports để tránh tree-shake nuốt ─────────────────────
void Legend
