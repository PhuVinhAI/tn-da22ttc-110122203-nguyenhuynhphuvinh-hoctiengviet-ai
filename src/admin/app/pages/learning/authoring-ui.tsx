import { Link } from 'react-router'
import {
  Check,
  ChevronRight,
  MoreVertical,
  Pencil,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { SortableRow } from '../../components/admin/shared/SortableRow'
import { DragHandle } from '../../components/admin/shared/DragHandle'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'

/* Khối UI dùng chung cho chuỗi wizard soạn bài (ADR 0002) — mỗi màn hình một việc. */

/**
 * Header của 1 section trong trang (vd "Bài học theo lộ trình" + nút Thêm).
 * Đứng giữa hero và list/grid bên dưới. Pattern y hệt ModuleDetailPage /
 * CourseDetailPage — nút "Thêm" thuộc về SectionHeader, KHÔNG thuộc PageHero.
 */
export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

/**
 * Header chuẩn cho mọi trang bên trong khu soạn bài (step/list/type/detail).
 *
 * Khung `rounded-xl border-2 border-border bg-card p-5` — đồng style với hero
 * card của ModuleDetailPage / LessonDetailPage.
 *
 * Layout: [icon] [eyebrow + title + count badge + description] · · · [actions]
 *         [footer slot — meta row / stats / pills phụ]
 */
export function PageHero({
  Icon,
  iconClass = 'bg-primary/10 text-primary',
  eyebrow,
  title,
  count,
  description,
  actions,
  footer,
}: {
  Icon?: React.ComponentType<{ className?: string }>
  iconClass?: string
  /** Nhãn nhỏ uppercase trên đầu title — ngữ cảnh (VD tên bài tập cha). */
  eyebrow?: React.ReactNode
  title: string
  /** Hiện badge số phía sau title. */
  count?: { value: number; label: string }
  description?: React.ReactNode
  /** Nút bên phải (Back / Edit / Add ...). */
  actions?: React.ReactNode
  /** Slot dưới đáy card, ngăn cách bằng border — chứa meta row, stats, hoặc lesson type distribution. */
  footer?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border-2 border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 min-w-0">
          {Icon && (
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {eyebrow}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {count && (
                <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-bold tabular-nums">
                  {count.value} {count.label}
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {footer && <div className="mt-4 pt-4 border-t-2 border-border">{footer}</div>}
    </div>
  )
}

/** Cổng chọn (khu / loại) — luôn dẫn sâu vào trong, không soạn tại chỗ. */
export function GateCard({
  to,
  Icon,
  iconClass = 'bg-primary/10 text-primary',
  label,
  description,
  count,
  countLabel = 'mục',
  recommended = 0,
}: {
  to: string
  Icon: React.ComponentType<{ className?: string }>
  iconClass?: string
  label: string
  description?: string
  count: number
  countLabel?: string
  /** Số lượng "khuyến nghị" — nếu > 0, hiện progress bar count/recommended và pill "Cần thêm". */
  recommended?: number
}) {
  const target = Math.max(0, recommended)
  const progress = target > 0 ? Math.min(100, Math.round((count / target) * 100)) : count > 0 ? 100 : 0
  let status: 'done' | 'partial' | 'empty'
  if (target > 0) status = count >= target ? 'done' : count > 0 ? 'partial' : 'empty'
  else status = count > 0 ? 'done' : 'empty'

  return (
    <Link
      to={to}
      className="group flex flex-col gap-4 rounded-xl border-2 border-border bg-card p-5 transition-colors hover:border-primary focus:outline-none focus-visible:border-primary"
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-6 w-6" />
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="text-base font-bold leading-tight">{label}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{description}</p>
        )}
      </div>
      <div className="space-y-2 pt-3 border-t-2 border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tabular-nums">{count}</span>
            {target > 0 && (
              <span className="text-sm text-muted-foreground tabular-nums">/ {target}</span>
            )}
            <span className="text-xs font-medium text-muted-foreground">{countLabel}</span>
          </div>
          <StatusPill status={status} />
        </div>
        {target > 0 && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all ${
                status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  )
}

/** Pill trạng thái dùng cho GateCard, StageGate. */
export function StatusPill({ status }: { status: 'done' | 'partial' | 'empty' }) {
  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
        <Check className="h-3.5 w-3.5" />
        Đã soạn
      </span>
    )
  }
  if (status === 'partial') {
    return (
      <span className="inline-flex items-center rounded-md bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
        Cần thêm
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
      Trống
    </span>
  )
}

/** Hàng trong danh sách chọn mục — bấm để vào form soạn riêng; menu chỉ có Sửa/Xóa. */
export function ItemRow({
  onOpen,
  onDelete,
  leading,
  title,
  meta,
  dragHandle,
  className,
}: {
  onOpen: () => void
  onDelete: () => void
  leading?: React.ReactNode
  title: React.ReactNode
  meta?: React.ReactNode
  dragHandle?: React.ReactNode
  className?: string
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen()
      }}
      className={
        className ??
        'group flex items-center gap-4 bg-card px-5 py-4 cursor-pointer transition-colors hover:bg-muted/40 focus:outline-none focus-visible:bg-muted/40'
      }
    >
      {dragHandle && (
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="shrink-0 self-center"
        >
          {dragHandle}
        </div>
      )}
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-base font-bold text-foreground leading-snug truncate">{title}</div>
        {meta && (
          <div className="mt-1 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            {meta}
          </div>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="shrink-0 -mr-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Tùy chọn</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={onOpen}>
              <Pencil className="h-4 w-4" />
              Mở để soạn
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 className="h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

/**
 * ItemRow có drag handle để sắp xếp lại (dnd-kit). Khác ItemRow ở chỗ mỗi
 * hàng là một card có viền riêng để khi kéo nhấc lên không vỡ đường divide.
 * Dùng chung trong DndContext + SortableContext bao quanh `space-y-2` wrapper.
 */
export function SortableItemRow({
  id,
  onOpen,
  onDelete,
  leading,
  title,
  meta,
  disabled,
}: {
  id: string
  onOpen: () => void
  onDelete: () => void
  leading?: React.ReactNode
  title: React.ReactNode
  meta?: React.ReactNode
  disabled?: boolean
}) {
  return (
    <SortableRow id={id} disabled={disabled}>
      {({ listeners, attributes }) => (
        <ItemRow
          onOpen={onOpen}
          onDelete={onDelete}
          leading={leading}
          title={title}
          meta={meta}
          dragHandle={<DragHandle {...listeners} {...attributes} />}
          className="group flex items-center gap-4 rounded-lg border-2 border-border bg-card pl-3 pr-3 py-4 cursor-pointer transition-colors hover:border-primary hover:bg-muted/20 focus:outline-none focus:border-primary"
        />
      )}
    </SortableRow>
  )
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  resource,
  label,
  onConfirm,
  extraWarning,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource: string
  label: string
  onConfirm: () => void
  extraWarning?: string
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Xóa {resource}?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {resource.charAt(0).toUpperCase() + resource.slice(1)}{' '}
            <span className="font-semibold text-foreground">&quot;{label}&quot;</span>
            {extraWarning ? ` ${extraWarning}` : ''} sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:opacity-90"
            onClick={onConfirm}
          >
            <Trash2 className="h-4 w-4" />
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/* ── Field components (đặt trực tiếp trong body ComposerCard, không thanh nổi) ── */

/** Khung textarea cho ghi chú giảng dạy — không hiển thị cho học viên. */
export function NotesField({
  value,
  onChange,
  placeholder = 'Ghi chú dành cho người soạn…',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-sm leading-relaxed outline-none focus-visible:border-primary resize-y"
    />
  )
}

/** Nhãn nhóm field trong thân form — cùng kiểu với form câu hỏi. */
export function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{children}</p>
      {right && <p className="text-xs text-muted-foreground">{right}</p>}
    </div>
  )
}

/** Khung tài liệu trung tâm — header dải màu + thân rộng rãi. */
export function ComposerCard({
  Icon,
  iconClass,
  typeLabel,
  statusRight,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>
  iconClass: string
  typeLabel: string
  statusRight?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border-2 border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-6 py-3 border-b-2 border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-md ${iconClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {typeLabel}
            </span>
            {statusRight && (
              <>
                <span className="text-muted-foreground text-xs">·</span>
                {statusRight}
              </>
            )}
          </div>
        </div>
        <div className="px-6 py-8 sm:px-10 sm:py-12 space-y-8">{children}</div>
      </div>
    </div>
  )
}

/** Thanh lưu cố định đáy màn — form wizard lưu tường minh, không autosave. */
export function StickySaveBar({
  contextLabel,
  backTo,
  submitting,
  submitLabel,
  onSave,
}: {
  contextLabel: React.ReactNode
  backTo: string
  submitting: boolean
  submitLabel: string
  onSave: () => void
}) {
  return (
    <div className="sticky bottom-[-2.5rem] -mx-10 -mb-10 mt-10 z-30 border-t-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-10 py-3">
      <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{contextLabel}</span>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to={backTo}>
              <X className="h-4 w-4" />
              Hủy
            </Link>
          </Button>
          <Button onClick={onSave} disabled={submitting}>
            <Save className="h-4 w-4" />
            {submitting ? 'Đang lưu...' : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
