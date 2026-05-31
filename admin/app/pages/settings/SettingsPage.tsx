import { RefreshCw, Trash2, Settings as SettingsIcon, Database } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ConfirmAction } from '../../components/admin/ConfirmAction'
import { LoadingState } from '../../components/admin/LoadingState'
import { useCacheStats, useSettingsMutation } from '../../features/settings/api/use-settings'

export function SettingsPage() {
  const { data, isLoading, error, refetch, isFetching } = useCacheStats()
  const mutations = useSettingsMutation()

  const clearCache = async () => {
    try {
      await mutations.clearCache.mutateAsync()
      toast.success('Đã xóa cache')
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa cache')
    }
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'Cài đặt' }]} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <SettingsIcon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold">Cài đặt</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Quản trị các thành phần vận hành đang có trong backend
          </p>
        </div>
      </div>

      {/* Cache Section */}
      <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-8 border-b-2 border-border">
          <div className="flex items-center gap-4">
            <Database className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Cache</h2>
              <p className="text-base text-muted-foreground">Quản lý cache hệ thống</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? 'animate-spin' : ''} />
              Làm mới
            </Button>
            <ConfirmAction
              title="Xóa cache hệ thống"
              description="Toàn bộ cache Redis hoặc cache memory hiện tại sẽ bị xóa."
              confirmLabel="Xóa cache"
              onConfirm={clearCache}
            >
              <Button variant="destructive" size="lg" disabled={mutations.clearCache.isPending}>
                <Trash2 />
                Xóa cache
              </Button>
            </ConfirmAction>
          </div>
        </div>

        <div className="p-8">
          {isLoading ? (
            <LoadingState message="Đang tải thông tin cache..." />
          ) : error ? (
            <Alert variant="destructive" className="border-2">
              <AlertTitle className="text-lg font-bold">Không tải được cache</AlertTitle>
              <AlertDescription className="text-base">{error instanceof Error ? error.message : 'Lỗi không xác định'}</AlertDescription>
            </Alert>
          ) : data ? (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Metric label="Loại cache" value={data.type} />
                <Metric label="Kết nối" value={data.connected ? 'Đang kết nối' : 'Fallback'} />
                <Metric label="Keys memory" value={data.size ?? '-'} />
              </div>

              <div className="rounded-xl border-2 border-border p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-base px-4 py-2">{data.type}</Badge>
                  <Badge variant={data.connected ? 'default' : 'secondary'} className="text-base px-4 py-2">
                    {data.connected ? 'Redis' : 'Memory'}
                  </Badge>
                </div>
                {data.error ? (
                  <Alert variant="destructive">
                    <AlertDescription className="text-base">{data.error}</AlertDescription>
                  </Alert>
                ) : null}
                {data.info ? (
                  <div className="rounded-xl bg-muted p-4">
                    <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-sm font-mono text-foreground">
                      {data.info}
                    </pre>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border-2 border-border bg-muted/30 p-6">
      <p className="text-sm font-semibold text-muted-foreground mb-2">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}
