import { LayoutDashboard, RefreshCw } from 'lucide-react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { dashboardKeys, useDashboardPulse } from '../../features/dashboard'
import { AttentionSection } from './sections/AttentionSection'
import { TrendsSection } from './sections/TrendsSection'
import { TotalsGrid } from './sections/PulseSection'

/**
 * Bảng điều khiển trả lời 3 câu hỏi của quản trị viên, theo thứ tự:
 * 1. Tổng quan hệ thống               → Hero Card (greeting + totals grid)
 * 2. Tôi cần làm gì ngay?            → Cần xử lý (AttentionSection)
 * 3. Xu hướng ra sao?                → Xu hướng + giờ học cao điểm (TrendsSection)
 * Mỗi section tự tải dữ liệu — phần chậm không chặn phần nhanh.
 */
export function DashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fetchingCount = useIsFetching({ queryKey: dashboardKeys.all })
  const refreshing = fetchingCount > 0

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
  }

  const { data: pulse, isLoading } = useDashboardPulse()

  return (
    <div className="space-y-6">
      {/* Hero Card — greeting + totals grid */}
      <div className="rounded-xl border-2 border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <LayoutDashboard className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Bảng điều khiển
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {greeting()},{' '}
                <span className="font-semibold text-foreground">{user?.fullName}</span>
                . {todayLabel()} — số liệu theo ngày lịch Việt Nam.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Đang cập nhật...' : 'Làm mới'}
          </Button>
        </div>

        <div className="mt-5">
          <TotalsGrid totals={pulse?.totals} loading={isLoading} />
        </div>
      </div>

      <AttentionSection />
      <TrendsSection />
    </div>
  )
}

/** Lời chào theo giờ Việt Nam. */
function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat('vi-VN', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date()),
  )
  if (hour < 12) return 'Chào buổi sáng'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

function todayLabel(): string {
  const label = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date())
  return label.charAt(0).toUpperCase() + label.slice(1)
}
