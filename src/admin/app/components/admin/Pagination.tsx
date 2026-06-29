import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
}

function pageNumbers(current: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages: (number | 'gap')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(totalPages - 1, current + 1)
  if (start > 2) pages.push('gap')
  for (let i = start; i <= end; i += 1) pages.push(i)
  if (end < totalPages - 1) pages.push('gap')
  pages.push(totalPages)
  return pages
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [20, 50, 100],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(total, page * pageSize)
  const items = pageNumbers(page, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-border bg-card px-3 py-2">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="tabular-nums">
          <span className="font-bold text-foreground">{start.toLocaleString('vi-VN')}</span>
          {' – '}
          <span className="font-bold text-foreground">{end.toLocaleString('vi-VN')}</span>
          {' / '}
          <span className="font-bold text-foreground">{total.toLocaleString('vi-VN')}</span>
        </span>
        {onPageSizeChange ? (
          <div className="flex items-center gap-1.5">
            <span>Mỗi trang</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger size="sm" className="h-8 px-2 text-xs font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs font-bold">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        <PageBtn onClick={() => onPageChange(1)} disabled={page <= 1} title="Trang đầu">
          <ChevronsLeft className="h-4 w-4" />
        </PageBtn>
        <PageBtn onClick={() => onPageChange(page - 1)} disabled={page <= 1} title="Trước">
          <ChevronLeft className="h-4 w-4" />
        </PageBtn>

        {items.map((item, idx) =>
          item === 'gap' ? (
            <span key={`gap-${idx}`} className="px-2 text-xs text-muted-foreground">…</span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-bold tabular-nums transition-colors ${
                item === page
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {item}
            </button>
          ),
        )}

        <PageBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} title="Sau">
          <ChevronRight className="h-4 w-4" />
        </PageBtn>
        <PageBtn onClick={() => onPageChange(totalPages)} disabled={page >= totalPages} title="Trang cuối">
          <ChevronsRight className="h-4 w-4" />
        </PageBtn>
      </div>
    </div>
  )
}

function PageBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}
