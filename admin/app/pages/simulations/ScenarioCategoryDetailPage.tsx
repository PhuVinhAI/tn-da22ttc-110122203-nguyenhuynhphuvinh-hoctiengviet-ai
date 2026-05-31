import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Plus, Edit, MessageSquare, Users } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { LoadingState } from '../../components/admin/LoadingState'
import { ErrorState } from '../../components/admin/ErrorState'
import { EmptyState } from '../../components/admin/EmptyState'
import { useAdminScenarioCategory, useSimulationsAdminMutation } from '../../features/simulations/api/use-simulations-admin'
import type { Scenario } from '../../features/simulations/types'
import { simulationPath } from './route-utils'

export function ScenarioCategoryDetailPage() {
  const { categoryId } = useParams()
  const { data: category, isLoading, error, refetch } = useAdminScenarioCategory(categoryId)
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
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'Mô phỏng', href: simulationPath.categories() }, { label: category?.name ?? 'Danh mục' }]} />

      {/* Category Header */}
      <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
        <div
          className="h-40 flex items-center justify-center relative"
          style={{ backgroundColor: category?.color || '#6366F1' }}
        >
          <MessageSquare className="h-20 w-20 text-white/30" />
          {categoryId && (
            <Button asChild variant="secondary" size="lg" className="absolute top-6 right-6">
              <Link to={simulationPath.categoryEdit(categoryId)}>
                <Edit className="h-5 w-5" />
                Sửa danh mục
              </Link>
            </Button>
          )}
        </div>

        <div className="p-8">
          <h1 className="text-4xl font-bold mb-3">{category?.name ?? 'Danh mục tình huống'}</h1>
          {category?.description && (
            <p className="text-lg text-muted-foreground mb-6">{category.description}</p>
          )}

          <div className="grid grid-cols-3 gap-6">
            <div className="rounded-xl border-2 border-border bg-muted/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">Tình huống</span>
              </div>
              <p className="text-3xl font-bold">{category?.scenarios?.length ?? 0}</p>
            </div>
            <div className="rounded-xl border-2 border-border bg-muted/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-6 w-6 text-secondary" />
                <span className="text-sm font-semibold text-muted-foreground">Nhân vật</span>
              </div>
              <p className="text-3xl font-bold">
                {category?.scenarios?.reduce((sum, s) => sum + (s.characters?.length ?? 0), 0) ?? 0}
              </p>
            </div>
            <div className="rounded-xl border-2 border-border bg-muted/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold text-muted-foreground">Thứ tự</span>
              </div>
              <p className="text-3xl font-bold">#{category?.orderIndex ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scenarios Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Các tình huống</h2>
          {categoryId && (
            <Button asChild size="lg">
              <Link to={simulationPath.scenarioNew(categoryId)}>
                <Plus className="h-5 w-5" />
                Thêm tình huống
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <LoadingState message="Đang tải tình huống..." />
        ) : error ? (
          <ErrorState
            message={error instanceof Error ? error.message : 'Không tải được dữ liệu'}
            onRetry={() => refetch()}
          />
        ) : !category?.scenarios || category.scenarios.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Chưa có tình huống nào"
            description="Tạo tình huống đầu tiên cho danh mục này"
            action={
              categoryId ? (
                <Button asChild size="lg">
                  <Link to={simulationPath.scenarioNew(categoryId)}>
                    <Plus className="h-5 w-5" />
                    Tạo tình huống đầu tiên
                  </Link>
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="group rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary hover:-translate-y-2"
              >
                <div className="space-y-4">
                  <div>
                    <Link to={simulationPath.scenario(scenario.id)} className="block mb-2">
                      <h3 className="text-xl font-bold text-foreground hover:text-primary transition-colors line-clamp-2">
                        {scenario.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">{scenario.requiredLevel}</Badge>
                      <Badge variant="outline">{scenario.difficulty}</Badge>
                      {scenario.isPublished && <Badge>Published</Badge>}
                    </div>
                    {scenario.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{scenario.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{scenario.characters?.length ?? 0} nhân vật</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="default" size="sm" className="flex-1">
                      <Link to={simulationPath.scenario(scenario.id)}>Mở</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={simulationPath.scenarioEdit(scenario.categoryId, scenario.id)}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Xóa tình huống "${scenario.title}"?`)) {
                          remove(scenario)
                        }
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
