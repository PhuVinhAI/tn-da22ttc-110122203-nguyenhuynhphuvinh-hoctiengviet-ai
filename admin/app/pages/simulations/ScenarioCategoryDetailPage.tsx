import { useState } from 'react'
import type { MouseEvent, KeyboardEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import {
  Plus, Pencil, MessageSquare, Users, MoreVertical, Trash2, Clock, Eye, EyeOff,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ListRowsSkeleton } from '../../components/admin/PageSkeletons'
import { ErrorState, errorMessage } from '../../components/admin/ErrorState'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { useAdminScenarioCategory, useSimulationsAdminMutation } from '../../features/simulations/api/use-simulations-admin'
import { getCategoryIcon } from '../../components/admin/editors/IconPicker'
import type { Scenario } from '../../features/simulations/types'
import { simulationPath } from './route-utils'

const levelMeta: Record<string, string> = {
  A1: 'bg-emerald-500',
  A2: 'bg-teal-500',
  B1: 'bg-blue-500',
  B2: 'bg-indigo-500',
  C1: 'bg-purple-500',
  C2: 'bg-rose-500',
}

const difficultyMeta: Record<string, { label: string; color: string }> = {
  EASY: { label: 'Dễ', color: 'text-emerald-700 dark:text-emerald-300' },
  MEDIUM: { label: 'Trung bình', color: 'text-amber-700 dark:text-amber-300' },
  HARD: { label: 'Khó', color: 'text-rose-700 dark:text-rose-300' },
}

export function ScenarioCategoryDetailPage() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const { data: category, isLoading, error, refetch, isFetching } = useAdminScenarioCategory(categoryId)
  const mutations = useSimulationsAdminMutation()
  const [pendingDelete, setPendingDelete] = useState<Scenario | null>(null)
  const [levelFilter, setLevelFilter] = useState<string>('all')

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await mutations.deleteScenario.mutateAsync(pendingDelete.id)
      toast.success('Đã xóa tình huống')
      setPendingDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  const stop = (e: MouseEvent | KeyboardEvent) => e.stopPropagation()

  const scenarios = category?.scenarios ?? []
  const filteredScenarios = scenarios.filter(
    (s) => levelFilter === 'all' || s.requiredLevel === levelFilter
  )
  const totalCharacters = scenarios.reduce((sum, s) => sum + (s.characters?.length ?? 0), 0)
  const publishedCount = scenarios.filter((s) => s.isPublished).length
  const categoryColor = category?.color || '#6366F1'
  const CategoryIcon = getCategoryIcon(category?.icon)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Mô phỏng hội thoại', href: simulationPath.categories() },
          { label: category?.name ?? 'Danh mục' },
        ]}
      />

      {/* Header card */}
      <div className="rounded-xl border-2 border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: categoryColor }}
          >
            <CategoryIcon className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs mb-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-bold uppercase tracking-wider text-muted-foreground">
                Danh mục mô phỏng
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {category?.name ?? 'Danh mục'}
            </h1>
            {category?.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl">
                {category.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span className="font-bold text-foreground tabular-nums">{scenarios.length}</span>
                tình huống
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span className="font-bold text-foreground tabular-nums">{publishedCount}</span>
                đã xuất bản
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span className="font-bold text-foreground tabular-nums">{totalCharacters}</span>
                nhân vật
              </span>
            </div>
          </div>
          {categoryId && (
            <Button asChild variant="outline" className="shrink-0">
              <Link to={simulationPath.categoryEdit(categoryId)}>
                <Pencil className="h-4 w-4" />
                Sửa
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filter + actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Lọc cấp độ:
          </span>
          <div className="flex items-center gap-1 rounded-lg border-2 border-border bg-card p-1">
            <FilterPill active={levelFilter === 'all'} onClick={() => setLevelFilter('all')}>
              Tất cả
            </FilterPill>
            {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((level) => (
              <FilterPill key={level} active={levelFilter === level} onClick={() => setLevelFilter(level)}>
                {level}
              </FilterPill>
            ))}
          </div>
        </div>
        {categoryId && (
          <Button asChild>
            <Link to={simulationPath.scenarioNew(categoryId)}>
              <Plus className="h-4 w-4" />
              Thêm tình huống
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <ListRowsSkeleton count={4} />
      ) : error ? (
        <ErrorState
          message={errorMessage(error)}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : scenarios.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="text-lg font-bold mb-1">Chưa có tình huống nào</h3>
          <p className="text-sm text-muted-foreground mb-4">Tạo tình huống đầu tiên cho danh mục này</p>
          {categoryId && (
            <Button asChild>
              <Link to={simulationPath.scenarioNew(categoryId)}>
                <Plus className="h-4 w-4" />
                Tạo tình huống đầu tiên
              </Link>
            </Button>
          )}
        </div>
      ) : filteredScenarios.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">Không có tình huống ở cấp độ này</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredScenarios.map((scenario) => {
            const levelBg = levelMeta[scenario.requiredLevel] ?? 'bg-muted'
            const diff = difficultyMeta[scenario.difficulty] ?? { label: scenario.difficulty, color: 'text-muted-foreground' }
            return (
              <div
                key={scenario.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(simulationPath.scenario(scenario.id))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(simulationPath.scenario(scenario.id))
                }}
                className="group rounded-lg border-2 border-border bg-card overflow-hidden cursor-pointer transition-colors hover:border-primary focus:outline-none focus:border-primary"
              >
                {/* Top strip with level + status */}
                <div className="flex items-center justify-between gap-2 px-4 py-2 border-b-2 border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center justify-center h-6 w-8 rounded text-[11px] font-bold text-white ${levelBg}`}
                    >
                      {scenario.requiredLevel}
                    </span>
                    <span className={`text-xs font-bold ${diff.color}`}>{diff.label}</span>
                    {scenario.isPublished ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <Eye className="h-3 w-3" />
                        Đã xuất bản
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <EyeOff className="h-3 w-3" />
                        Bản nháp
                      </span>
                    )}
                  </div>
                  <div onClick={stop} onKeyDown={stop}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 -mr-1 text-muted-foreground hover:text-foreground"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem asChild>
                          <Link to={simulationPath.scenarioEdit(scenario.categoryId, scenario.id)}>
                            <Pencil className="h-4 w-4" />
                            Chỉnh sửa
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setPendingDelete(scenario)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa tình huống
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-base font-bold text-foreground line-clamp-1">
                    {scenario.title}
                  </h3>
                  {scenario.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {scenario.description}
                    </p>
                  )}

                  {/* Opening message preview */}
                  {scenario.openingMessage ? (
                    <div className="mt-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Lời chào mở đầu
                      </p>
                      <p className="text-xs italic text-foreground line-clamp-1">
                        &quot;{scenario.openingMessage}&quot;
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/10 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">
                        Lời chào mở đầu
                      </p>
                      <p className="text-xs italic text-muted-foreground/60 line-clamp-1">
                        Chưa có lời chào mở đầu
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-bold tabular-nums text-foreground">
                        {scenario.characters?.length ?? 0}
                      </span>
                      <span>nhân vật</span>
                    </span>
                    {scenario.estimatedMinutes && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-bold tabular-nums text-foreground">
                          {scenario.estimatedMinutes}
                        </span>
                        <span>phút</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Xóa tình huống?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Tình huống <span className="font-semibold text-foreground">&quot;{pendingDelete?.title}&quot;</span> cùng các nhân vật và đoạn hội thoại liên quan sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:opacity-90"
              onClick={confirmDelete}
            >
              <Trash2 className="h-4 w-4" />
              Xóa tình huống
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  )
}
