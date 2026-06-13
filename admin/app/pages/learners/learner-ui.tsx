import type { ComponentType, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

// ─── Bảng màu chung — flat, không gradient, đồng bộ với dashboard ────────────
export const INDIGO = '#6366F1'
export const VIOLET = '#8B5CF6'
export const CYAN = '#06B6D4'
export const GREEN = '#22C55E'
export const AMBER = '#F59E0B'
export const BLUE = '#3B82F6'
export const ROSE = '#F43F5E'
export const TEAL = '#14B8A6'
export const SLATE = '#64748B'
export const FUCHSIA = '#D946EF'
export const EMERALD = '#10B981'
export const ORANGE = '#F97316'

export const LEVEL_COLOR: Record<string, string> = {
  A1: EMERALD,
  A2: TEAL,
  B1: BLUE,
  B2: INDIGO,
  C1: VIOLET,
  C2: ROSE,
}

export const LEVEL_LABEL: Record<string, string> = {
  A1: 'Mới bắt đầu',
  A2: 'Sơ cấp',
  B1: 'Trung cấp',
  B2: 'Trên trung cấp',
  C1: 'Cao cấp',
  C2: 'Thông thạo',
}

export const QUESTION_TYPE_LABEL: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm',
  fill_blank: 'Điền chỗ trống',
  matching: 'Ghép cặp',
  ordering: 'Sắp xếp',
  translation: 'Dịch nghĩa',
  listening: 'Nghe',
  speaking: 'Nói',
}

export const PART_OF_SPEECH_LABEL: Record<string, string> = {
  noun: 'Danh từ',
  verb: 'Động từ',
  adjective: 'Tính từ',
  adverb: 'Trạng từ',
  pronoun: 'Đại từ',
  preposition: 'Giới từ',
  conjunction: 'Liên từ',
  phrase: 'Cụm từ',
  interjection: 'Thán từ',
  measure: 'Lượng từ',
  particle: 'Trợ từ',
}

export const VOCAB_SOURCE_LABEL: Record<string, string> = {
  system: 'Hệ thống',
  manual: 'Tự thêm',
  image: 'Từ ảnh',
  other: 'Khác',
}

export const STRENGTH_LABEL: Record<string, string> = {
  strong: 'Mạnh',
  average: 'Khá',
  weak: 'Yếu',
  untested: 'Chưa thử',
}

export const STRENGTH_TINT: Record<string, string> = {
  strong: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  average: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
  weak: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
  untested: 'bg-muted text-muted-foreground',
}

export const HEALTH_LABEL: Record<string, string> = {
  active: 'Đang hoạt động',
  at_risk: 'Có nguy cơ rời bỏ',
  dormant: 'Ngủ đông',
  new: 'Mới',
}

export const HEALTH_TINT: Record<string, { dot: string; bg: string; text: string }> = {
  active: {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  at_risk: {
    dot: 'bg-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
  },
  dormant: {
    dot: 'bg-rose-500',
    bg: 'bg-rose-100 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
  },
  new: {
    dot: 'bg-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
  },
}

export const INSIGHT_TINT: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  success: {
    bg: 'bg-emerald-50/60 dark:bg-emerald-950/30',
    border: 'border-emerald-300/60 dark:border-emerald-800/60',
    text: 'text-emerald-900 dark:text-emerald-100',
    iconBg: 'bg-emerald-500 text-white',
  },
  info: {
    bg: 'bg-blue-50/60 dark:bg-blue-950/30',
    border: 'border-blue-300/60 dark:border-blue-800/60',
    text: 'text-blue-900 dark:text-blue-100',
    iconBg: 'bg-blue-500 text-white',
  },
  warning: {
    bg: 'bg-amber-50/60 dark:bg-amber-950/30',
    border: 'border-amber-300/60 dark:border-amber-800/60',
    text: 'text-amber-900 dark:text-amber-100',
    iconBg: 'bg-amber-500 text-white',
  },
  critical: {
    bg: 'bg-rose-50/60 dark:bg-rose-950/30',
    border: 'border-rose-300/60 dark:border-rose-800/60',
    text: 'text-rose-900 dark:text-rose-100',
    iconBg: 'bg-rose-500 text-white',
  },
}

// ─── Định dạng ──────────────────────────────────────────────────────────────
const numberFormatter = new Intl.NumberFormat('vi-VN')
const compactFormatter = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 })
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' })
const fullDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatNumber(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '—'
  return numberFormatter.format(value)
}

export function formatCompact(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '—'
  return compactFormatter.format(value)
}

export function formatPercent(ratio?: number | null, digits = 1): string {
  if (ratio == null || Number.isNaN(ratio)) return '—'
  return `${(ratio * 100).toFixed(digits).replace('.', ',')}%`
}

export function formatDuration(seconds?: number | null): string {
  if (seconds == null || seconds <= 0) return '0 phút'
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h >= 24) {
    const days = Math.floor(h / 24)
    const remH = h % 24
    return `${days} ngày ${remH} giờ`
  }
  if (h > 0) return `${h} giờ ${m} phút`
  return `${m} phút`
}

export function formatDateShort(iso: string): string {
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const date = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]))
  return dateFormatter.format(date)
}

export function formatDateLong(iso?: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return fullDateFormatter.format(date)
}

export function formatRelative(iso?: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} giờ trước`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 30) return `${diffD} ngày trước`
  return fullDateFormatter.format(date)
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
const palette = [INDIGO, VIOLET, CYAN, GREEN, AMBER, BLUE, ROSE, TEAL, FUCHSIA]

export function hashColor(id?: string): string {
  if (!id) return SLATE
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff
  return palette[Math.abs(hash) % palette.length]
}

export function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─── Section frame ──────────────────────────────────────────────────────────
export function SectionCard({
  title,
  hint,
  icon: Icon,
  iconTint = INDIGO,
  actions,
  children,
  compact = false,
}: {
  title: string
  hint?: ReactNode
  icon?: ComponentType<{ className?: string }> | LucideIcon
  iconTint?: string
  actions?: ReactNode
  children: ReactNode
  compact?: boolean
}) {
  return (
    <section className={`rounded-xl border-2 border-border bg-card ${compact ? 'p-4' : 'p-5'}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
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
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function EmptyChart({
  message,
  icon: Icon,
}: {
  message: string
  icon?: ComponentType<{ className?: string }> | LucideIcon
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-center">
      {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
