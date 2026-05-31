import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Save, MessageSquare } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ResourceForm } from '../../components/admin/ResourceForm'
import { scenarioFields } from '../../features/simulations/types/forms'
import { useAdminScenario, useAdminScenarioCategory, useSimulationsAdminMutation } from '../../features/simulations/api/use-simulations-admin'
import { simulationPath } from './route-utils'

export function ScenarioFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { categoryId, id } = useParams()
  const navigate = useNavigate()
  const { data: scenario } = useAdminScenario(id)
  const parentCategoryId = categoryId ?? scenario?.categoryId
  const { data: category } = useAdminScenarioCategory(parentCategoryId)
  const mutations = useSimulationsAdminMutation()

  const submit = async (payload: Record<string, unknown>) => {
    try {
      if (mode === 'edit' && id) {
        await mutations.updateScenario.mutateAsync({ id, payload })
        toast.success('Đã cập nhật tình huống')
        navigate(simulationPath.scenario(id))
      } else if (categoryId) {
        await mutations.createScenario.mutateAsync({ categoryId, payload })
        toast.success('Đã tạo tình huống')
        navigate(simulationPath.category(categoryId))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu')
    }
  }

  const backPath = parentCategoryId ? simulationPath.category(parentCategoryId) : simulationPath.categories()

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Mô phỏng', href: simulationPath.categories() },
          { label: category?.name ?? 'Danh mục', href: parentCategoryId ? simulationPath.category(parentCategoryId) : simulationPath.categories() },
          { label: mode === 'edit' ? scenario?.title ?? 'Sửa' : 'Thêm' },
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
              <h1 className="text-4xl font-bold">{mode === 'edit' ? 'Sửa tình huống' : 'Tạo tình huống mới'}</h1>
              <p className="text-lg text-muted-foreground mt-2">
                {mode === 'edit' ? 'Cập nhật thông tin tình huống' : 'Điền thông tin để tạo tình huống mới'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="lg">
            <Link to={backPath}>Hủy</Link>
          </Button>
          <Button type="submit" form="scenario-form" size="lg">
            <Save className="h-5 w-5" />
            {mode === 'edit' ? 'Cập nhật' : 'Tạo tình huống'}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl">
        <div className="rounded-2xl border-2 border-border bg-card p-8">
          <ResourceForm id="scenario-form" fields={scenarioFields} initialValue={scenario} onSubmit={submit} />
        </div>
      </div>
    </div>
  )
}
