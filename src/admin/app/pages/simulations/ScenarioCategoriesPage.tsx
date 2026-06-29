import { useState } from 'react'
import type { MouseEvent, KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Plus, MessageSquare, Pencil, Trash2, MoreVertical, Users, Search } from 'lucide-react'
import { getCategoryIcon } from '../../components/admin/editors/IconPicker'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
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
import { useAdminScenarioCategories, useSimulationsAdminMutation } from '../../features/simulations/api/use-simulations-admin'
import { CardGridSkeleton } from '../../components/admin/PageSkeletons'
import { ErrorState, errorMessage } from '../../components/admin/ErrorState'
import type { ScenarioCategory } from '../../features/simulations/types'
import { simulationPath } from './route-utils'

export function ScenarioCategoriesPage() {
  const navigate = useNavigate()
  const { data = [], isLoading, error, refetch, isFetching } = useAdminScenarioCategories()
  const mutations = useSimulationsAdminMutation()
  const [pendingDelete, setPendingDelete] = useState<ScenarioCategory | null>(null)
  const [search, setSearch] = useState('')

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await mutations.deleteCategory.mutateAsync(pendingDelete.id)
      toast.success('Đã xóa danh mục')
      setPendingDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  const stop = (e: MouseEvent | KeyboardEvent) => e.stopPropagation()

  const totalScenarios = data.reduce((sum, c) => sum + (c.scenarios?.length ?? 0), 0)
  const filtered = search
    ? data.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : data

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="rounded-xl border-2 border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <MessageSquare className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Mô phỏng hội thoại</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl">
              Tổ chức tình huống và nhân vật cho mô phỏng AI.
            </p>
            {!isLoading && !error && data.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-bold text-foreground tabular-nums">{data.length}</span>
                  danh mục
                </span>
                <span className="text-muted-foreground/60">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span className="font-bold text-foreground tabular-nums">{totalScenarios}</span>
                  tình huống
                </span>
              </div>
            )}
          </div>
          <Button asChild className="shrink-0">
            <Link to={simulationPath.categoryNew()}>
              <Plus className="h-4 w-4" />
              Thêm danh mục
            </Link>
          </Button>
        </div>
      </div>

      {!isLoading && !error && data.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm danh mục..."
            className="pl-9"
          />
        </div>
      )}

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : error ? (
        <ErrorState
          message={errorMessage(error)}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : data.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="text-lg font-bold mb-1">Chưa có danh mục nào</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tạo danh mục đầu tiên để tổ chức các tình huống mô phỏng
          </p>
          <Button asChild>
            <Link to={simulationPath.categoryNew()}>
              <Plus className="h-4 w-4" />
              Tạo danh mục đầu tiên
            </Link>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 text-center">
          <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="text-lg font-bold mb-1">Không tìm thấy danh mục</h3>
          <p className="text-sm text-muted-foreground">Thử thay đổi từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onOpen={() => navigate(simulationPath.category(category.id))}
              onDelete={() => setPendingDelete(category)}
              stop={stop}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Danh mục <span className="font-semibold text-foreground">&quot;{pendingDelete?.name}&quot;</span> và toàn bộ tình huống, nhân vật bên trong sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:opacity-90"
              onClick={confirmDelete}
            >
              <Trash2 className="h-4 w-4" />
              Xóa danh mục
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CategoryCard({
  category,
  onOpen,
  onDelete,
  stop,
}: {
  category: ScenarioCategory
  onOpen: () => void
  onDelete: () => void
  stop: (e: MouseEvent | KeyboardEvent) => void
}) {
  const color = category.color || '#6366F1'
  const CategoryIcon = getCategoryIcon(category.icon)
  const characterCount =
    category.scenarios?.reduce((sum, s) => sum + (s.characters?.length ?? 0), 0) ?? 0
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen()
      }}
      className="group relative flex items-center gap-3 rounded-lg border-2 border-border bg-card p-4 cursor-pointer transition-colors hover:border-primary focus:outline-none focus:border-primary"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: color }}
      >
        <CategoryIcon className="h-6 w-6 text-white" strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-foreground line-clamp-1 pr-8">
          {category.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
          {category.description}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="font-bold tabular-nums text-foreground">
              {category.scenarios?.length ?? 0}
            </span>
            tình huống
          </span>
          <span className="text-muted-foreground/60">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="font-bold tabular-nums text-foreground">{characterCount}</span>
            nhân vật
          </span>
        </div>
      </div>

      <div onClick={stop} onKeyDown={stop} className="absolute top-3 right-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link to={simulationPath.categoryEdit(category.id)}>
                <Pencil className="h-4 w-4" />
                Chỉnh sửa
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 className="h-4 w-4" />
              Xóa danh mục
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
