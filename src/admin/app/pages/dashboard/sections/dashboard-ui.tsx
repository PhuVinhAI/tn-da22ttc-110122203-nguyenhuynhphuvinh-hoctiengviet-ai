import type { ComponentType, ReactNode } from 'react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Skeleton } from '../../../components/ui/skeleton'
import type { PulsePoint, UserLevelCode } from '../../../features/dashboard'

/* Khối UI dùng chung cho các section của Bảng điều khiển — flat, border-2,
   không gradient/shadow, nhãn tiếng Việt. */

// ─── Bảng màu ────────────────────────────────────────────────────────────────

export const INDIGO = '#6366F1'
export const VIOLET = '#8B5CF6'
export const CYAN = '#06B6D4'
export const GREEN = '#22C55E'
export const AMBER = '#F59E0B'
export const BLUE = '#3B82F6'
export const ROSE = '#F43F5E'
export const TEAL = '#14B8A6'
export const SLATE = '#64748B'

export const LEVEL_COLOR: Record<UserLevelCode, string> = {
  A1: GREEN,
  A2: TEAL,
  B1: BLUE,
  B2: INDIGO,
  C1: VIOLET,
  C2: ROSE,
}

export const QUESTION_TYPE_LABEL: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm',
  fill_blank: 'Điền chỗ trống',
  matching: 'Ghép cặp',
  ordering: 'Sắp xếp',
  translation: 'Dịch nghĩa',
  listening: 'Nghe hiểu',
  speaking: 'Nói',
}

// ─── Định dạng ───────────────────────────────────────────────────────────────

const numberFormatter = new Intl.NumberFormat('vi-VN')
const shortDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
})

export function formatNumber(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return '—'
  return numberFormatter.format(value)
}

/** Tỷ lệ 0–1 → "82,4%". */
export function formatPercent(ratio: number | undefined | null): string {
  if (ratio == null || Number.isNaN(ratio)) return '—'
  return `${(ratio * 100).toFixed(1).replace('.', ',')}%`
}

/** "2026-06-11" → "11/06". */
export function formatDateShort(iso: string): string {
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const date = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]))
  return shortDateFormatter.format(date)
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (diffMinutes < 1) return 'Vừa xong'
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} ngày trước`
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function hashColor(id: string): string {
  const palette = [INDIGO, VIOLET, CYAN, GREEN, AMBER, BLUE, ROSE, TEAL]
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff
  }
  return palette[Math.abs(hash) % palette.length]
}

// ─── Khung section ───────────────────────────────────────────────────────────

export function SectionCard({
  title,
  hint,
  icon: Icon,
  iconTint = INDIGO,
  actions,
  children,
}: {
  title: string
  hint?: string
  icon?: ComponentType<{ className?: string }>
  iconTint?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border-2 border-border bg-card p-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${iconTint}1F`, color: iconTint }}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            {hint && (
              <p className="text-sm text-muted-foreground mt-0.5">{hint}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </header>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function EmptyState({
  message,
  icon: Icon,
}: {
  message: string
  icon?: ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-border bg-muted/30 px-6 py-10 text-center">
      {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

// ─── Chênh lệch so với hôm qua ───────────────────────────────────────────────

/**
 * Hiển thị chênh lệch tuyệt đối hôm nay so với hôm qua (▲ +3 / ▼ −2 / 0).
 * Số tuyệt đối dễ hành động hơn % khi quy mô còn nhỏ.
 */
export function DeltaBadge({
  today,
  yesterday,
}: {
  today: number
  yesterday: number
}) {
  const diff = today - yesterday
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus
  const tone =
    diff > 0
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : diff < 0
        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
        : 'bg-muted text-muted-foreground'
  const label = diff > 0 ? `+${formatNumber(diff)}` : formatNumber(diff)

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${tone}`}
      title="So với hôm qua"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

// ─── Sparkline thuần SVG ─────────────────────────────────────────────────────

export function Sparkline({
  points,
  color,
  height = 36,
}: {
  points: PulsePoint[]
  color: string
  height?: number
}) {
  const width = 100
  if (points.length < 2) {
    return <div style={{ height }} />
  }
  const max = Math.max(...points.map((p) => p.value), 1)
  const stepX = width / (points.length - 1)
  const toY = (value: number) => height - 3 - (value / max) * (height - 6)
  const coords = points.map((p, i) => `${(i * stepX).toFixed(2)},${toY(p.value).toFixed(2)}`)
  const areaPath = `M0,${height} L${coords.join(' L')} L${width},${height} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <path d={areaPath} fill={color} opacity={0.1} />
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

// ─── Avatar & hàng người dùng ────────────────────────────────────────────────

export function Avatar({
  fullName,
  avatarUrl,
  userId,
  size = 9,
}: {
  fullName: string
  avatarUrl: string | null
  userId: string
  size?: 8 | 9 | 10
}) {
  const sizeClass = size === 8 ? 'h-8 w-8 text-[11px]' : size === 10 ? 'h-10 w-10 text-sm' : 'h-9 w-9 text-xs'
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        className={`${sizeClass} shrink-0 rounded-full border-2 border-border object-cover`}
      />
    )
  }
  const tint = hashColor(userId)
  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full font-bold`}
      style={{ backgroundColor: `${tint}26`, color: tint }}
    >
      {getInitials(fullName)}
    </div>
  )
}

export function LevelBadge({ level }: { level: UserLevelCode }) {
  const tint = LEVEL_COLOR[level] ?? SLATE
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold"
      style={{ backgroundColor: `${tint}1F`, color: tint }}
    >
      {level}
    </span>
  )
}

// ─── Mini stat card ────────────────────────────────────────────────────────────

/**
 * Card thống kê nhỏ với icon, label, số lớn. Dùng cho grid tổng quan hệ thống.
 */
export function MiniStatCard({
  label,
  value,
  icon: Icon,
  tint,
  subtitle,
}: {
  label: string
  value: number | string
  icon: ComponentType<{ className?: string }>
  tint: string
  subtitle?: string
}) {
  return (
    <div className="rounded-lg border-2 border-border bg-card p-4">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${tint}1F`, color: tint }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="mt-2.5 text-2xl font-bold tabular-nums tracking-tight">
        {value}
      </p>
      {subtitle && (
        <p className="mt-0.5 text-[10px] text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
