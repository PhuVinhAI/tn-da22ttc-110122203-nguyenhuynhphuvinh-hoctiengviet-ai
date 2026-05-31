import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ResourceForm } from '../../components/admin/ResourceForm'
import type { FieldConfig } from '../../features/learning/types/forms'

interface StandardFormPageProps {
  mode: 'create' | 'edit'
  title: string
  breadcrumbs: Array<{ label: string; href?: string }>
  fields: FieldConfig[]
  getData: () => any
  onSubmit: (payload: Record<string, unknown>) => Promise<void>
  backPath: string
}

/**
 * Standard Form Page Template
 * Reusable template for all CRUD form pages
 */
export function StandardFormPage({
  mode,
  title,
  breadcrumbs,
  fields,
  getData,
  onSubmit,
  backPath,
}: StandardFormPageProps) {
  const navigate = useNavigate()
  const data = getData()

  const handleSubmit = async (payload: Record<string, unknown>) => {
    try {
      await onSubmit(payload)
      toast.success(mode === 'edit' ? 'Đã cập nhật' : 'Đã tạo mới')
      navigate(backPath)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu')
    }
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon-lg">
            <Link to={backPath}>
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold">{title}</h1>
            <p className="text-lg text-muted-foreground mt-2">
              {mode === 'edit' ? 'Cập nhật thông tin' : 'Điền thông tin để tạo mới'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="lg">
            <Link to={backPath}>Hủy</Link>
          </Button>
          <Button type="submit" form="standard-form" size="lg">
            <Save className="h-5 w-5" />
            {mode === 'edit' ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <div className="rounded-2xl border-2 border-border bg-card p-8">
          <ResourceForm
            id="standard-form"
            fields={fields}
            initialValue={data}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}
