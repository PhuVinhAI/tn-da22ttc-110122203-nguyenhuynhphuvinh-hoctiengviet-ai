import { Skeleton } from '../ui/skeleton'

export function CardGridSkeleton({
  count = 6,
  columns = 'sm:grid-cols-2 lg:grid-cols-3',
}: {
  count?: number
  columns?: string
}) {
  return (
    <div className={`grid grid-cols-1 ${columns} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border-2 border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-10" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t-2 border-border">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CourseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border-2 border-border bg-card overflow-hidden">
          <Skeleton className="h-32 w-full rounded-none" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ListRowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border-2 border-border bg-card p-4"
        >
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

export function ModuleListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border-2 border-border bg-card p-4"
        >
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="hidden sm:block h-4 w-14" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  )
}

export function LessonTimelineSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="relative">
      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" aria-hidden />
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="relative flex items-start gap-3 rounded-lg border-2 border-border bg-card pl-3 pr-3 py-3"
          >
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function MetricCardsSkeleton({
  count = 3,
  columns = 'md:grid-cols-3',
}: {
  count?: number
  columns?: string
}) {
  return (
    <div className={`grid grid-cols-1 ${columns} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border-2 border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="mt-2 h-6 w-16" />
        </div>
      ))}
    </div>
  )
}

export function ConversationSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="rounded-lg border-2 border-border bg-card p-4 sm:p-6 space-y-4">
      {Array.from({ length: count }).map((_, i) => {
        const isUser = i % 2 === 1
        return (
          <div
            key={i}
            className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div
              className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className={`h-12 rounded-2xl ${isUser ? 'w-64' : 'w-72'}`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function LessonContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="border-b-2 border-border">
        <div className="flex gap-4 px-1 py-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28" />
          ))}
        </div>
      </div>
      <ListRowsSkeleton count={4} />
    </div>
  )
}

export function VocabFlashcardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border-2 border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b-2 border-border bg-muted/30 px-4 py-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <div className="flex gap-1.5 pt-2 border-t border-border">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ScenarioDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl border-2 border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-border bg-muted/30">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="p-4 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
        <div className="rounded-xl border-2 border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-border bg-muted/30">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b-2 border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-7 w-16" />
          </div>
          <div className="p-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border-2 border-border bg-card p-3"
              >
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
