import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ScenarioForm } from '../../components/admin/forms/ScenarioForm'
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
    const criteria = Array.isArray(payload.scoringCriteria) ? payload.scoringCriteria : []
    const totalWeight = criteria.reduce(
      (sum: number, c: any) => sum + (Number(c?.weight) || 0),
      0,
    )
    if (criteria.length > 0 && totalWeight !== 100) {
      toast.error(`Tổng trọng số các tiêu chí phải đúng 100% (hiện ${totalWeight}%).`)
      return
    }

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
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: category?.name ?? 'Danh mục', href: parentCategoryId ? simulationPath.category(parentCategoryId) : simulationPath.categories() },
          { label: mode === 'edit' ? scenario?.title ?? 'Sửa' : 'Thêm' },
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
              {mode === 'edit' ? 'Sửa tình huống' : 'Tạo tình huống mới'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {mode === 'edit' ? 'Cập nhật thông tin tình huống' : 'Điền thông tin để tạo tình huống mới'}
            </p>
          </div>
        </div>

        {mode === 'edit' && !scenario ? (
          <div className="rounded-xl border-2 border-border bg-card p-12 text-center text-sm text-muted-foreground">
            Đang tải tình huống...
          </div>
        ) : (
          <ScenarioForm
            id="scenario-form"
            initialValue={scenario}
            onSubmit={(values) => submit(values as unknown as Record<string, unknown>)}
          />
        )}

        <div className="flex items-center justify-end gap-2 pt-4 border-t-2 border-border">
          <Button asChild variant="ghost">
            <Link to={backPath}>Hủy</Link>
          </Button>
          <Button type="submit" form="scenario-form">
            <Save className="h-4 w-4" />
            {mode === 'edit' ? 'Cập nhật' : 'Tạo tình huống'}
          </Button>
        </div>
      </div>
    </div>
  )
}
