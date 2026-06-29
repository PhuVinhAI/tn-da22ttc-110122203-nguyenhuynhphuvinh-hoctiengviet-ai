import type { ConveyorApi } from '@/lib/conveyor/api'

declare global {
  interface Window {
    conveyor?: ConveyorApi // Optional vì trong web mode không có
  }
}
