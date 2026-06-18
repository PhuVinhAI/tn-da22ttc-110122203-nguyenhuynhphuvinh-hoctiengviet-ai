import { RefreshCw } from 'lucide-react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { dashboardKeys } from '../../features/dashboard'
import { PulseSection } from './sections/PulseSection'
import { AttentionSection } from './sections/AttentionSection'
import { TrendsSection } from './sections/TrendsSection'

/**
 * Bang dieu khien tra loi 3 cau hoi cua quan tri vien, theo thu tu:
 * 1. Hôm nay hệ thống thế nào?       → Nhịp đập (PulseSection)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Bảng điều khiển
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {greeting()},{' '}
            <span className="font-bold text-foreground">{user?.fullName}</span>.{' '}
            {todayLabel()} — số liệu tính theo ngày lịch Việt Nam.
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={refreshAll}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Đang cập nhật...' : 'Làm mới tất cả'}
        </Button>
      </div>

      <PulseSection />
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
