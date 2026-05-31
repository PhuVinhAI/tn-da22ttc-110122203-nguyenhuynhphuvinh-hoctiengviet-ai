import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Plus, Edit, MessageSquare, Users, User } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { LoadingState } from '../../components/admin/LoadingState'
import { ErrorState } from '../../components/admin/ErrorState'
import { EmptyState } from '../../components/admin/EmptyState'
import { useAdminScenario, useSimulationsAdminMutation } from '../../features/simulations/api/use-simulations-admin'
import type { ScenarioCharacter } from '../../features/simulations/types'
import { simulationPath } from './route-utils'

export function ScenarioDetailPage() {
  const { scenarioId } = useParams()
  const { data: scenario, isLoading, error, refetch } = useAdminScenario(scenarioId)
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
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Mô phỏng', href: simulationPath.categories() },
          { label: scenario?.category?.name ?? 'Danh mục', href: scenario?.categoryId ? simulationPath.category(scenario.categoryId) : undefined },
          { label: scenario?.title ?? 'Tình huống' },
        ]}
      />

      {/* Scenario Header */}
      <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
        <div className="h-32 bg-primary/10 flex items-center justify-center relative border-b-2 border-border">
          <MessageSquare className="h-16 w-16 text-primary/30" />
          {scenarioId && scenario && (
            <Button asChild variant="secondary" size="lg" className="absolute top-4 right-6">
              <Link to={simulationPath.scenarioEdit(scenario.categoryId, scenarioId)}>
                <Edit className="h-5 w-5" />
                Sửa tình huống
              </Link>
            </Button>
          )}
        </div>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="secondary" className="text-base px-4 py-2">
              {scenario?.requiredLevel}
            </Badge>
            <Badge variant="outline" className="text-base px-4 py-2">
              {scenario?.difficulty}
            </Badge>
            {scenario?.isPublished && (
              <Badge className="text-base px-4 py-2">Published</Badge>
            )}
          </div>

          <h1 className="text-4xl font-bold mb-3">{scenario?.title ?? 'Tình huống'}</h1>
          {scenario?.description && (
            <p className="text-lg text-muted-foreground mb-6">{scenario.description}</p>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-xl border-2 border-border bg-muted/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">Nhân vật</span>
              </div>
              <p className="text-3xl font-bold">{scenario?.characters?.length ?? 0}</p>
            </div>
            <div className="rounded-xl border-2 border-border bg-muted/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <User className="h-6 w-6 text-secondary" />
                <span className="text-sm font-semibold text-muted-foreground">Playable</span>
              </div>
              <p className="text-3xl font-bold">
                {scenario?.characters?.filter(c => c.isPlayable).length ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Characters Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Nhân vật</h2>
          {scenarioId && (
            <Button asChild size="lg">
              <Link to={simulationPath.characterNew(scenarioId)}>
                <Plus className="h-5 w-5" />
                Thêm nhân vật
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <LoadingState message="Đang tải nhân vật..." />
        ) : error ? (
          <ErrorState
            message={error instanceof Error ? error.message : 'Không tải được dữ liệu'}
            onRetry={() => refetch()}
          />
        ) : !scenario?.characters || scenario.characters.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Chưa có nhân vật nào"
            description="Tạo nhân vật đầu tiên cho tình huống này"
            action={
              scenarioId ? (
                <Button asChild size="lg">
                  <Link to={simulationPath.characterNew(scenarioId)}>
                    <Plus className="h-5 w-5" />
                    Tạo nhân vật đầu tiên
                  </Link>
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenario.characters.map((character) => (
              <div
                key={character.id}
                className="group rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary hover:-translate-y-2"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{character.name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">{character.role}</Badge>
                        {character.isPlayable && <Badge>Playable</Badge>}
                      </div>
                      {character.personality && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{character.personality}</p>
                      )}
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                      <span className="text-xl font-bold text-primary">#{character.orderIndex}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="default" size="sm" className="flex-1">
                      <Link to={simulationPath.characterEdit(character.scenarioId, character.id)}>
                        <Edit className="h-4 w-4" />
                        Sửa
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Xóa nhân vật "${character.name}"?`)) {
                          remove(character)
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
