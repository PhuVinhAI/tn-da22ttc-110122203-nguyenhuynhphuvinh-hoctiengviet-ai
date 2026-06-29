/**
 * Universal Conveyor API
 * Tự động chọn real hoặc mock API dựa trên platform
 */

import { isElectron } from '@/lib/platform'
import type { ConveyorApi } from './index'
import { mockConveyor } from './web-mock'

// Hàm lấy conveyor API phù hợp với platform
export const getConveyor = (): ConveyorApi => {
  if (isElectron()) {
    // Trong Electron, window.conveyor được expose từ preload
    return window.conveyor
  } else {
    // Trong web, dùng mock
    return mockConveyor
  }
}

// Export để dùng trong app
export const conveyor = getConveyor()
