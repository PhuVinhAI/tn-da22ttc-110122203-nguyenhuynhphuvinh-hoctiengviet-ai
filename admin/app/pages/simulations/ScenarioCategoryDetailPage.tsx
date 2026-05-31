import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ConfirmAction } from '../../components/admin/ConfirmAction'
import { DataTable } from '../../components/admin/DataTable'
import { PageHeader } from '../../components/admin/PageHeader'
import { useAdminScenarioCategory, useSimulationsAdminMutation } from '../../features/simulations/api/use-simulations-admin'
import type { Scenario } from '../../features/simulations/types'
import { simulationPath } from './route-utils'

export function ScenarioCategoryDetailPage() {
  const { categoryId } = useParams()
  const { data: category, isLoading, error } = useAdminScenarioCategory(categoryId)
  const mutations = useSimulationsAdminMutation()

  const remove = async (scenario: Scenario) => {
    try {
      await mutations.deleteScenario.mutateAsync(scenario.id)
      toast.success('Đã xóa tình huống')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Mô phỏng', href: simulationPath.categories() }, { label: category?.name ?? 'Danh mục' }]} />
      <PageHeader
        title={category?.name ?? 'Danh mục tình huống'}
        description={category?.description}
        actions={categoryId ? <Button asChild><Link to={simulationPath.scenarioNew(categoryId)}>Thêm tình huống</Link></Button> : null}
      />
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Không tải được dữ liệu'}</p>
          ) : (
            <DataTable
              data={category?.scenarios ?? []}
              empty="Chưa có tình huống"
              columns={[
                { key: 'title', header: 'Tên', cell: (row) => <Link className="font-medium hover:text-primary" to={simulationPath.scenario(row.id)}>{row.title}</Link> },
                { key: 'level', header: 'Level', cell: (row) => row.requiredLevel },
                { key: 'difficulty', header: 'Độ khó', cell: (row) => row.difficulty },
                { key: 'characters', header: 'Nhân vật', cell: (row) => row.characters?.length ?? 0 },
                { key: 'published', header: 'Published', cell: (row) => (row.isPublished ? 'Có' : 'Không') },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right',
                  cell: (row) => (
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm"><Link to={simulationPath.scenario(row.id)}>Mở</Link></Button>
                      <Button asChild variant="ghost" size="sm"><Link to={simulationPath.scenarioEdit(row.categoryId, row.id)}>Sửa</Link></Button>
                      <ConfirmAction
                        title="Xóa tình huống"
                        description={`Tình huống "${row.title}" và nhân vật liên quan sẽ bị xóa.`}
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
