/**
 * Web Mock for Conveyor API
 * Cung cấp mock implementation cho các API khi chạy trên web
 */

import type { ConveyorApi } from './index'

// Mock App API cho web
const mockAppApi = {
  version: async () => 'web-1.0.0',
  getName: async () => 'LinVNix Admin (Web)',
  getPath: async (name: string) => `/mock-path/${name}`,
}

// Mock Window API cho web
const mockWindowApi = {
  windowMinimize: () => console.warn('Window minimize not available in web'),
  windowMaximize: () => console.warn('Window maximize not available in web'),
  windowClose: () => window.close(),
  windowToggleMaximize: () => console.warn('Window toggle not available in web'),
}

// Export mock conveyor
export const mockConveyor: ConveyorApi = {
  app: mockAppApi as any,
  window: mockWindowApi as any,
}
