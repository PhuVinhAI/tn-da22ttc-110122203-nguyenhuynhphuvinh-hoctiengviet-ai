import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description?: string
}

/**
 * Placeholder Page Component
 * Used for pages that are not yet implemented
 */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-muted/50 border-2 border-dashed border-border">
            <Construction className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground">{title}</h1>
          <p className="text-lg text-muted-foreground">
            {description || 'Trang này đang được phát triển'}
          </p>
        </div>
      </div>
    </div>
  )
}
