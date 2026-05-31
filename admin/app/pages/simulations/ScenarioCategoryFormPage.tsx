import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { PageHeader } from '../../components/admin/PageHeader'
import { ResourceForm } from '../../components/admin/ResourceForm'
import { scenarioCategoryFields } from '../../features/simulations/types/forms'
import { useAdminScenarioCategory, useSimulationsAdminMutation } from '../../features/simulations/api/use-simulations-admin'
import { simulationPath } from './route-utils'

export function ScenarioCategoryFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: category } = useAdminScenarioCategory(id)
  const mutations = useSimulationsAdminMutation()

  const submit = async (payload: Record<string, unknown>) => {
    try {
      if (mode === 'edit' && id) {
        await mutations.updateCategory.mutateAsync({ id, payload })
        toast.success('Đã cập nhật danh mục')
        navigate(simulationPath.category(id))
      } else {
        await mutations.createCategory.mutateAsync(payload)
        toast.success('Đã tạo danh mục')
        navigate(simulationPath.categories())
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu')
    }
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Mô phỏng', href: simulationPath.categories() }, { label: mode === 'edit' ? category?.name ?? 'Sửa' : 'Thêm danh mục' }]} />
      <PageHeader title={mode === 'edit' ? 'Sửa danh mục' : 'Thêm danh mục'} actions={<Button asChild variant="outline"><Link to={simulationPath.categories()}>Quay lại</Link></Button>} />
      <Card>
        <CardContent className="p-5">
          <ResourceForm fields={scenarioCategoryFields} initialValue={category as Record<string, unknown> | undefined} onSubmit={submit} />
        </CardContent>
      </Card>
    </div>
  )
}
