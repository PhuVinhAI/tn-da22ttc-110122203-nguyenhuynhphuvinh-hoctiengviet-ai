import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ScenarioCharacterForm } from '../../components/admin/forms/ScenarioCharacterForm'
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
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: scenario?.category?.name ?? 'Danh mục', href: scenario?.categoryId ? simulationPath.category(scenario.categoryId) : simulationPath.categories() },
          { label: scenario?.title ?? 'Tình huống', href: scenarioId ? simulationPath.scenario(scenarioId) : undefined },
          { label: mode === 'edit' ? character?.name ?? 'Sửa' : 'Thêm nhân vật' },
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
              {mode === 'edit' ? 'Sửa nhân vật' : 'Tạo nhân vật mới'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {scenario?.title
                ? `Trong tình huống "${scenario.title}"`
                : 'Điền thông tin để tạo nhân vật mới'}
            </p>
          </div>
        </div>

        <ScenarioCharacterForm
          id="character-form"
          initialValue={character}
          onSubmit={(values) => submit(values as unknown as Record<string, unknown>)}
        />

        <div className="flex items-center justify-end gap-2 pt-4 border-t-2 border-border">
          <Button asChild variant="ghost">
            <Link to={backPath}>Hủy</Link>
          </Button>
          <Button type="submit" form="character-form">
            <Save className="h-4 w-4" />
            {mode === 'edit' ? 'Cập nhật' : 'Tạo nhân vật'}
          </Button>
        </div>
      </div>
    </div>
  )
}
