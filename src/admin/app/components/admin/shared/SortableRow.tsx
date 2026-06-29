import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SortableRow({
  id,
  disabled,
  children,
  className,
  as: As = 'div',
}: {
  id: string
  disabled?: boolean
  children: (api: {
    setNodeRef: (el: HTMLElement | null) => void
    style: CSSProperties
    listeners: ReturnType<typeof useSortable>['listeners']
    attributes: ReturnType<typeof useSortable>['attributes']
    isDragging: boolean
  }) => ReactNode
  className?: string
  as?: 'div' | 'tr'
}) {
  const sortable = useSortable({ id, disabled })
  const { setNodeRef, transform, transition, listeners, attributes, isDragging } = sortable

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : undefined,
  }

  if (As === 'tr') {
    return (
      <tr
        ref={setNodeRef as (el: HTMLTableRowElement | null) => void}
        style={style}
        className={cn(className, isDragging && 'relative')}
      >
        {children({ setNodeRef, style, listeners, attributes, isDragging })}
      </tr>
    )
  }

  return (
    <div
      ref={setNodeRef as (el: HTMLDivElement | null) => void}
      style={style}
      className={cn(className, isDragging && 'relative')}
    >
      {children({ setNodeRef, style, listeners, attributes, isDragging })}
    </div>
  )
}
