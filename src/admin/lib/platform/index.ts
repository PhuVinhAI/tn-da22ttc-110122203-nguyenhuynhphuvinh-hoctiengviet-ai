/**
 * Platform Detection & Configuration
 * Phát hiện môi trường runtime và cung cấp config phù hợp
 */

// Kiểm tra xem có đang chạy trong Electron không
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 'conveyor' in window
}

export const isWeb = (): boolean => {
  return !isElectron()
}

export type Platform = 'electron' | 'web'

export const getPlatform = (): Platform => {
  return isElectron() ? 'electron' : 'web'
}

// Platform-specific configuration
export interface PlatformConfig {
  platform: Platform
  apiBaseUrl: string
  features: {
    nativeWindow: boolean
    fileSystem: boolean
    notifications: boolean
  }
}

export const getPlatformConfig = (): PlatformConfig => {
  const platform = getPlatform()
  
  return {
    platform,
    apiBaseUrl: import.meta.env.VITE_API_URL || 
      (platform === 'electron' ? 'http://localhost:3000' : '/api'),
    features: {
      nativeWindow: platform === 'electron',
      fileSystem: platform === 'electron',
      notifications: true, // Both support
    },
  }
}
