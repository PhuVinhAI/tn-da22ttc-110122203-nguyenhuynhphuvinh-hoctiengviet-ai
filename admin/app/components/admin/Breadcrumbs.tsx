import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-3 text-base text-muted-foreground">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-3 h-10">
            {index > 0 ? <ChevronRight className="size-5" /> : null}
            {item.href ? (
              <Link to={item.href} className="hover:text-primary hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={`${isLast ? 'text-primary font-bold' : 'text-foreground'}`}>{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
