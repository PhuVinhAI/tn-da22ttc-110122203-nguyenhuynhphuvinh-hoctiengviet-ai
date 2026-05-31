import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { PageHeader } from '../../components/admin/PageHeader'
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

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Mô phỏng', href: simulationPath.categories() }, { label: category?.name ?? 'Danh mục', href: parentCategoryId ? simulationPath.category(parentCategoryId) : undefined }, { label: mode === 'edit' ? scenario?.title ?? 'Sửa' : 'Thêm tình huống' }]} />
      <PageHeader title={mode === 'edit' ? 'Sửa tình huống' : 'Thêm tình huống'} actions={<Button asChild variant="outline"><Link to={parentCategoryId ? simulationPath.category(parentCategoryId) : simulationPath.categories()}>Quay lại</Link></Button>} />
      <Card>
        <CardContent className="p-5">
          <ResourceForm fields={scenarioFields} initialValue={scenario as Record<string, unknown> | undefined} onSubmit={submit} />
        </CardContent>
      </Card>
    </div>
  )
}
