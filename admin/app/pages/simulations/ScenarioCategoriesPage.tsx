import { Link } from 'react-router'
import { toast } from 'sonner'
import { Plus, MessageSquare, Edit, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { PageHeader } from '../../components/admin/PageHeader'
import { LoadingState } from '../../components/admin/LoadingState'
import { ErrorState } from '../../components/admin/ErrorState'
import { EmptyState } from '../../components/admin/EmptyState'
import { useAdminScenarioCategories, useSimulationsAdminMutation } from '../../features/simulations/api/use-simulations-admin'
import type { ScenarioCategory } from '../../features/simulations/types'
import { simulationPath } from './route-utils'

export function ScenarioCategoriesPage() {
  const { data = [], isLoading, error, refetch } = useAdminScenarioCategories()
  const mutations = useSimulationsAdminMutation()

  const remove = async (category: ScenarioCategory) => {
    try {
      await mutations.deleteCategory.mutateAsync(category.id)
      toast.success('Đã xóa danh mục')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'Mô phỏng' }, { label: 'Danh mục tình huống' }]} />

      <PageHeader
        title="Danh mục tình huống"
        description="Đi vào từng danh mục để quản lý tình huống và nhân vật mô phỏng hội thoại."
        actions={
          <Button asChild size="lg">
            <Link to={simulationPath.categoryNew()}>
              <Plus className="h-5 w-5" />
              Thêm danh mục
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState message="Đang tải danh mục..." />
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'Không tải được dữ liệu'}
          onRetry={() => refetch()}
        />
      ) : data.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Chưa có danh mục nào"
          description="Tạo danh mục đầu tiên để tổ chức các tình huống mô phỏng"
          action={
            <Button asChild size="lg">
              <Link to={simulationPath.categoryNew()}>
                <Plus className="h-5 w-5" />
                Tạo danh mục đầu tiên
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((category) => (
            <div
              key={category.id}
              className="group rounded-2xl border-2 border-border bg-card overflow-hidden transition-all hover:border-primary hover:-translate-y-2"
            >
              {/* Color Header */}
              <div
                className="h-32 flex items-center justify-center relative"
                style={{ backgroundColor: category.color || '#6366F1' }}
              >
                <MessageSquare className="h-16 w-16 text-white/30" />
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="text-sm font-semibold">
                    #{category.orderIndex}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Title & Icon */}
                <div>
                  <Link to={simulationPath.category(category.id)} className="block mb-2">
                    <h3 className="text-xl font-bold text-foreground hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                  </Link>
                  {category.icon && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Icon:</span>
                      <code className="bg-muted px-2 py-1 rounded">{category.icon}</code>
                    </div>
                  )}
                </div>

                {/* Color Badge */}
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-lg border-2 border-border"
                    style={{ backgroundColor: category.color }}
                  />
                  <code className="text-sm text-muted-foreground">{category.color}</code>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button asChild variant="default" size="sm" className="flex-1">
                    <Link to={simulationPath.category(category.id)}>Mở</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={simulationPath.categoryEdit(category.id)}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Xóa danh mục "${category.name}"?`)) {
                        remove(category)
                      }
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
