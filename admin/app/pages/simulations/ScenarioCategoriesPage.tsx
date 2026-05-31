import { Link } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ConfirmAction } from '../../components/admin/ConfirmAction'
import { DataTable } from '../../components/admin/DataTable'
import { PageHeader } from '../../components/admin/PageHeader'
import { useAdminScenarioCategories, useSimulationsAdminMutation } from '../../features/simulations/api/use-simulations-admin'
import type { ScenarioCategory } from '../../features/simulations/types'
import { simulationPath } from './route-utils'

export function ScenarioCategoriesPage() {
  const { data = [], isLoading, error } = useAdminScenarioCategories()
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
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Mô phỏng' }, { label: 'Danh mục tình huống' }]} />
      <PageHeader
        title="Danh mục tình huống"
        description="Đi vào từng danh mục để quản lý tình huống và nhân vật."
        actions={<Button asChild><Link to={simulationPath.categoryNew()}>Thêm danh mục</Link></Button>}
      />
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Không tải được dữ liệu'}</p>
          ) : (
            <DataTable
              data={data}
              empty="Chưa có danh mục"
              columns={[
                { key: 'name', header: 'Tên', cell: (row) => <Link className="font-medium hover:text-primary" to={simulationPath.category(row.id)}>{row.name}</Link> },
                { key: 'icon', header: 'Icon', cell: (row) => row.icon },
                { key: 'color', header: 'Màu', cell: (row) => <span className="inline-flex items-center gap-2"><span className="size-4 rounded border" style={{ backgroundColor: row.color }} />{row.color}</span> },
                { key: 'order', header: 'Thứ tự', cell: (row) => row.orderIndex },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right',
                  cell: (row) => (
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm"><Link to={simulationPath.category(row.id)}>Mở</Link></Button>
                      <Button asChild variant="ghost" size="sm"><Link to={simulationPath.categoryEdit(row.id)}>Sửa</Link></Button>
                      <ConfirmAction
                        title="Xóa danh mục"
                        description={`Danh mục "${row.name}" và tình huống liên quan sẽ bị xóa.`}
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
