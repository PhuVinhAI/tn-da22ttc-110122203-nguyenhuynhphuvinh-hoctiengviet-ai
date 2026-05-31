import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Save, MessageSquare } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ResourceForm } from '../../components/admin/ResourceForm'
import { scenarioCategoryFields } from '../../features/simulations/types/forms'
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
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Mô phỏng', href: simulationPath.categories() },
          { label: 'Danh mục', href: simulationPath.categories() },
          { label: mode === 'edit' ? category?.name ?? 'Sửa' : 'Thêm' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon-lg">
            <Link to={backPath}>
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{mode === 'edit' ? 'Sửa danh mục' : 'Tạo danh mục mới'}</h1>
              <p className="text-lg text-muted-foreground mt-2">
                {mode === 'edit' ? 'Cập nhật thông tin danh mục' : 'Điền thông tin để tạo danh mục mới'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="lg">
            <Link to={backPath}>Hủy</Link>
          </Button>
          <Button type="submit" form="category-form" size="lg">
            <Save className="h-5 w-5" />
            {mode === 'edit' ? 'Cập nhật' : 'Tạo danh mục'}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl">
        <div className="rounded-2xl border-2 border-border bg-card p-8">
          <ResourceForm id="category-form" fields={scenarioCategoryFields} initialValue={category} onSubmit={submit} />
        </div>
      </div>
    </div>
  )
}
