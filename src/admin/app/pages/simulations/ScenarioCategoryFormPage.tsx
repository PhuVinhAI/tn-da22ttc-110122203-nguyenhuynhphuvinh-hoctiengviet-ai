import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ScenarioCategoryForm } from '../../components/admin/forms/ScenarioCategoryForm'
import { useAdminScenarioCategory, useSimulationsAdminMutation } from '../../features/simulations/api/use-simulations-admin'
import { simulationPath } from './route-utils'

export function ScenarioCategoryFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: category } = useAdminScenarioCategory(id)
  const mutations = useSimulationsAdminMutation()

  const submit = async (payload: Record<string, unknown>) => {
    try {
      if (mode === 'edit' && id) {
        await mutations.updateCategory.mutateAsync({ id, payload })
        toast.success('Đã cập nhật danh mục')
        navigate(simulationPath.category(id))
      } else {
        await mutations.createCategory.mutateAsync(payload)
        toast.success('Đã tạo danh mục')
        navigate(simulationPath.categories())
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu')
    }
  }

  const backPath = id ? simulationPath.category(id) : simulationPath.categories()

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Danh mục', href: simulationPath.categories() },
          { label: mode === 'edit' ? category?.name ?? 'Sửa' : 'Thêm' },
        ]}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-10 w-10 mt-0.5">
            <Link to={backPath}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === 'edit' ? 'Sửa danh mục' : 'Tạo danh mục mới'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {mode === 'edit' ? 'Cập nhật thông tin danh mục' : 'Điền thông tin để tạo danh mục mới'}
            </p>
          </div>
        </div>

        {mode === 'edit' && !category ? (
          <div className="rounded-xl border-2 border-border bg-card p-12 text-center text-sm text-muted-foreground">
            Đang tải danh mục...
          </div>
        ) : (
          <ScenarioCategoryForm
            id="category-form"
            initialValue={category}
            onSubmit={(values) => submit(values as unknown as Record<string, unknown>)}
          />
        )}

        <div className="flex items-center justify-end gap-2 pt-4 border-t-2 border-border">
          <Button asChild variant="ghost">
            <Link to={backPath}>Hủy</Link>
          </Button>
          <Button type="submit" form="category-form">
            <Save className="h-4 w-4" />
            {mode === 'edit' ? 'Cập nhật' : 'Tạo danh mục'}
          </Button>
        </div>
      </div>
    </div>
  )
}
