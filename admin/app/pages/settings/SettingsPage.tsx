import { RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ConfirmAction } from '../../components/admin/ConfirmAction'
import { PageHeader } from '../../components/admin/PageHeader'
import { useCacheStats, useSettingsMutation } from '../../features/settings/api/use-settings'

export function SettingsPage() {
  const { data, isLoading, error, refetch, isFetching } = useCacheStats()
  const mutations = useSettingsMutation()

  const clearCache = async () => {
    try {
      await mutations.clearCache.mutateAsync()
      toast.success('Đã xóa cache')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa cache')
    }
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Cài đặt' }]} />
      <PageHeader title="Cài đặt" description="Quản trị các thành phần vận hành đang có trong backend." />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cache</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw />
              Làm mới
            </Button>
            <ConfirmAction
              title="Xóa cache hệ thống"
              description="Toàn bộ cache Redis hoặc cache memory hiện tại sẽ bị xóa."
              confirmLabel="Xóa cache"
              onConfirm={clearCache}
            >
              <Button variant="destructive" disabled={mutations.clearCache.isPending}>
                <Trash2 />
                Xóa cache
              </Button>
            </ConfirmAction>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Không tải được cache</AlertTitle>
              <AlertDescription>{error instanceof Error ? error.message : 'Lỗi không xác định'}</AlertDescription>
            </Alert>
          ) : data ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <Metric label="Loại cache" value={data.type} />
                <Metric label="Kết nối" value={data.connected ? 'Đang kết nối' : 'Fallback'} />
                <Metric label="Keys memory" value={data.size ?? '-'} />
              </div>
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant="outline">{data.type}</Badge>
                  <Badge variant={data.connected ? 'default' : 'secondary'}>{data.connected ? 'Redis' : 'Memory'}</Badge>
                </div>
                {data.error ? <p className="text-sm text-destructive">{data.error}</p> : null}
                {data.info ? <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{data.info}</pre> : null}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  )
}
