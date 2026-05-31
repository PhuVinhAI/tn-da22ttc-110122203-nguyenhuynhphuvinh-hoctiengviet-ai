import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ConfirmAction } from '../../components/admin/ConfirmAction'
import { DataTable } from '../../components/admin/DataTable'
import { PageHeader } from '../../components/admin/PageHeader'
import { useAdminScenario, useSimulationsAdminMutation } from '../../features/simulations/api/use-simulations-admin'
import type { ScenarioCharacter } from '../../features/simulations/types'
import { simulationPath } from './route-utils'

export function ScenarioDetailPage() {
  const { scenarioId } = useParams()
  const { data: scenario, isLoading, error } = useAdminScenario(scenarioId)
  const mutations = useSimulationsAdminMutation()

  const remove = async (character: ScenarioCharacter) => {
    try {
      await mutations.deleteCharacter.mutateAsync(character.id)
      toast.success('Đã xóa nhân vật')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Mô phỏng', href: simulationPath.categories() }, { label: scenario?.category?.name ?? 'Danh mục', href: scenario?.categoryId ? simulationPath.category(scenario.categoryId) : undefined }, { label: scenario?.title ?? 'Tình huống' }]} />
      <PageHeader
        title={scenario?.title ?? 'Tình huống'}
        description={scenario?.description}
        actions={scenarioId ? (
          <>
            <Button asChild variant="outline"><Link to={simulationPath.scenarioEdit(scenario?.categoryId ?? '', scenarioId)}>Sửa tình huống</Link></Button>
            <Button asChild><Link to={simulationPath.characterNew(scenarioId)}>Thêm nhân vật</Link></Button>
          </>
        ) : null}
      />
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Không tải được dữ liệu'}</p>
          ) : (
            <DataTable
              data={scenario?.characters ?? []}
              empty="Chưa có nhân vật"
              columns={[
                { key: 'name', header: 'Tên', cell: (row) => row.name },
                { key: 'role', header: 'Vai', cell: (row) => row.role },
                { key: 'playable', header: 'Playable', cell: (row) => (row.isPlayable ? 'Có' : 'Không') },
                { key: 'order', header: 'Thứ tự', cell: (row) => row.orderIndex },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right',
                  cell: (row) => (
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="sm"><Link to={simulationPath.characterEdit(row.scenarioId, row.id)}>Sửa</Link></Button>
                      <ConfirmAction
                        title="Xóa nhân vật"
                        description={`Nhân vật "${row.name}" sẽ bị xóa khỏi tình huống.`}
                        onConfirm={() => remove(row)}
                      />
                    </div>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
