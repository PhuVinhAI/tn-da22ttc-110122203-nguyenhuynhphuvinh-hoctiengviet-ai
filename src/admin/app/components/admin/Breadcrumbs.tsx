import { Link } from 'react-router'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumbs({ items, homeHref = '/' }: { items: BreadcrumbItem[]; homeHref?: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-0.5 rounded-full border-2 border-border bg-card p-1 w-fit max-w-full"
    >
      <Link
        to={homeHref}
        aria-label="Trang chủ"
        className="inline-flex items-center justify-center h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const key = `${item.label}-${index}`
        return (
          <span key={key} className="inline-flex items-center gap-0.5">
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            {item.href && !isLast ? (
              <Link
                to={item.href}
                title={item.label}
                className="inline-block h-8 leading-8 rounded-full px-3 max-w-[22ch] truncate align-middle text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                title={item.label}
                className={`inline-block h-8 leading-8 rounded-full px-3 max-w-[28ch] truncate align-middle text-sm font-bold ${
                  isLast ? 'bg-primary/10 text-primary' : 'text-foreground'
                }`}
              >
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
