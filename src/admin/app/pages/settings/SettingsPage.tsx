import { useState } from 'react'
import {
  RefreshCw, Trash2, Database, Server, HardDrive, Activity, Info,
  Globe, Languages, Calendar, Cpu, Download, AppWindow, Monitor,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { MetricCardsSkeleton } from '../../components/admin/PageSkeletons'
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
import { useCacheStats, useSettingsMutation } from '../../features/settings/api/use-settings'

export function SettingsPage() {
  const { data, isLoading, error, refetch, isFetching } = useCacheStats()
  const mutations = useSettingsMutation()
  const [confirmClear, setConfirmClear] = useState(false)

  const clearCache = async () => {
    try {
      await mutations.clearCache.mutateAsync()
      toast.success('Đã xóa cache')
      setConfirmClear(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa cache')
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Cài đặt</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Quản trị các thành phần vận hành của hệ thống.
        </p>
      </div>

      {/* Cache Section */}
      <section className="space-y-4">
        <SectionHeader
          icon={Database}
          title="Bộ nhớ đệm"
          description="Quản lý cache Redis hoặc fallback bộ nhớ tạm."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              <Button
                variant="default"
                className="bg-destructive text-destructive-foreground hover:opacity-90"
                onClick={() => setConfirmClear(true)}
                disabled={mutations.clearCache.isPending}
              >
                <Trash2 className="h-4 w-4" />
                Xóa cache
              </Button>
            </div>
          }
        />

        {isLoading ? (
          <MetricCardsSkeleton count={3} />
        ) : error ? (
          <ErrorState
            title="Không tải được cache"
            message={errorMessage(error, 'Lỗi không xác định')}
            onRetry={() => refetch()}
            retrying={isFetching}
          />
        ) : data ? (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <MetricCard
                icon={HardDrive}
                label="Loại bộ nhớ"
                value={data.type}
                tone="primary"
              />
              <MetricCard
                icon={Activity}
                label="Trạng thái kết nối"
                value={data.connected ? 'Đang kết nối' : 'Bộ nhớ tạm'}
                tone={data.connected ? 'success' : 'warning'}
              />
              <MetricCard
                icon={Database}
                label="Số lượng keys"
                value={String(data.size ?? '—')}
                tone="muted"
              />
            </div>

            {data.error && (
              <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-4">
                <p className="text-sm font-bold text-destructive">Cảnh báo</p>
                <p className="text-xs text-destructive/80 mt-1">{data.error}</p>
              </div>
            )}

            {data.info && (
              <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Thông tin chi tiết
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {data.info.split('\n').length} dòng
                  </span>
                </div>
                <pre className="max-h-96 overflow-auto p-4 text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">
                  {data.info}
                </pre>
              </div>
            )}
          </>
        ) : null}
      </section>

      {/* System info */}
      <section className="space-y-4">
        <SectionHeader
          icon={Server}
          title="Hệ thống"
          description="Thông tin trạng thái và phiên bản hệ thống."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoCard icon={Cpu} label="Phiên bản ứng dụng" value="0.0.03062026" />
          <InfoCard icon={Globe} label="Phiên bản API" value="v1" />
          <InfoCard
            icon={Calendar}
            label="Múi giờ"
            value={Intl.DateTimeFormat().resolvedOptions().timeZone}
          />
          <InfoCard icon={Languages} label="Ngôn ngữ" value="Tiếng Việt" />
        </div>
      </section>

      {/* Desktop app */}
      <section className="space-y-4">
        <SectionHeader
          icon={Monitor}
          title="Ứng dụng desktop"
          description="Tải bản cài đặt Windows để dùng ngoài trình duyệt."
        />

        <div className="rounded-lg border-2 border-border bg-card p-5 flex items-center gap-4 flex-wrap">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <AppWindow className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-foreground">LinVNix Admin cho Windows</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Bản cài đặt NSIS · phiên bản 0.0.03062026 · 148 MB
            </p>
            <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
              linvnix-admin-demo-0.0.3062026-setup.exe
            </p>
          </div>
          <Button asChild className="rounded-full px-6 h-11">
            <a
              href="https://github.com/PhuVinhAI/LinVNix/releases/download/v0.0.03062026/linvnix-admin-demo-0.0.3062026-setup.exe"
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <Download className="h-4 w-4" />
              Tải xuống
            </a>
          </Button>
        </div>
      </section>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Xóa toàn bộ bộ nhớ đệm?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Toàn bộ cache (Redis hoặc bộ nhớ tạm) sẽ bị xóa ngay lập tức. Các yêu cầu đến sẽ phải tải lại dữ liệu từ cơ sở dữ liệu. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:opacity-90"
              onClick={clearCache}
            >
              <Trash2 className="h-4 w-4" />
              Xóa cache
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon: typeof Database
  title: string
  description: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap pb-2 border-b-2 border-border">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      {actions}
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Database
  label: string
  value: string
  tone: 'primary' | 'success' | 'warning' | 'muted'
}) {
  const toneMap = {
    primary: 'text-primary bg-primary/10',
    success: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950',
    warning: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950',
    muted: 'text-foreground bg-muted',
  }
  const textMap = {
    primary: 'text-primary',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    muted: 'text-foreground',
  }
  return (
    <div className="rounded-lg border-2 border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-md ${toneMap[tone]}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className={`mt-2 text-lg font-bold ${textMap[tone]}`}>{value}</p>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Database
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border-2 border-border bg-card p-4 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-mono font-bold text-foreground truncate mt-0.5">{value}</p>
      </div>
    </div>
  )
}
