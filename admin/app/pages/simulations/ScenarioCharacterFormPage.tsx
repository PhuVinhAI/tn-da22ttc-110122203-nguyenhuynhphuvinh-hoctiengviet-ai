import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { PageHeader } from '../../components/admin/PageHeader'
import { ResourceForm } from '../../components/admin/ResourceForm'
import { scenarioCharacterFields } from '../../features/simulations/types/forms'
import { useAdminScenario, useSimulationsAdminMutation } from '../../features/simulations/api/use-simulations-admin'
import { simulationPath } from './route-utils'

export function ScenarioCharacterFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { scenarioId, id } = useParams()
  const navigate = useNavigate()
  const { data: scenario } = useAdminScenario(scenarioId)
  const character = scenario?.characters?.find((item) => item.id === id)
  const mutations = useSimulationsAdminMutation()

  const submit = async (payload: Record<string, unknown>) => {
    try {
      if (mode === 'edit' && id) {
        await mutations.updateCharacter.mutateAsync({ id, payload })
        toast.success('Đã cập nhật nhân vật')
      } else if (scenarioId) {
        await mutations.createCharacter.mutateAsync({ scenarioId, payload })
        toast.success('Đã tạo nhân vật')
      }
      if (scenarioId) navigate(simulationPath.scenario(scenarioId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu')
    }
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Mô phỏng', href: simulationPath.categories() }, { label: scenario?.category?.name ?? 'Danh mục', href: scenario?.categoryId ? simulationPath.category(scenario.categoryId) : undefined }, { label: scenario?.title ?? 'Tình huống', href: scenarioId ? simulationPath.scenario(scenarioId) : undefined }, { label: mode === 'edit' ? character?.name ?? 'Sửa nhân vật' : 'Thêm nhân vật' }]} />
      <PageHeader title={mode === 'edit' ? 'Sửa nhân vật' : 'Thêm nhân vật'} actions={<Button asChild variant="outline"><Link to={scenarioId ? simulationPath.scenario(scenarioId) : simulationPath.categories()}>Quay lại</Link></Button>} />
      <Card>
        <CardContent className="p-5">
          <ResourceForm fields={scenarioCharacterFields} initialValue={character as Record<string, unknown> | undefined} onSubmit={submit} />
        </CardContent>
      </Card>
    </div>
  )
}
