import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Save, User } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
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

  const backPath = scenarioId ? simulationPath.scenario(scenarioId) : simulationPath.categories()

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Mô phỏng', href: simulationPath.categories() },
          { label: scenario?.category?.name ?? 'Danh mục', href: scenario?.categoryId ? simulationPath.category(scenario.categoryId) : simulationPath.categories() },
          { label: scenario?.title ?? 'Tình huống', href: scenarioId ? simulationPath.scenario(scenarioId) : undefined },
          { label: mode === 'edit' ? character?.name ?? 'Sửa' : 'Thêm nhân vật' },
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
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{mode === 'edit' ? 'Sửa nhân vật' : 'Tạo nhân vật mới'}</h1>
              <p className="text-lg text-muted-foreground mt-2">
                {scenario?.title ?? 'Tình huống'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="lg">
            <Link to={backPath}>Hủy</Link>
          </Button>
          <Button type="submit" form="character-form" size="lg">
            <Save className="h-5 w-5" />
            {mode === 'edit' ? 'Cập nhật' : 'Tạo nhân vật'}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl">
        <div className="rounded-2xl border-2 border-border bg-card p-8">
          <ResourceForm id="character-form" fields={scenarioCharacterFields} initialValue={character} onSubmit={submit} />
        </div>
      </div>
    </div>
  )
}
