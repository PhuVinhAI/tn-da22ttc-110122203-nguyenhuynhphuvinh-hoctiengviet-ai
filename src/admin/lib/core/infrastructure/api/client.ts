import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL, API_TIMEOUT } from '../../../shared/constants'
import { AppError } from '../../../shared/errors/AppError'
import type { ApiError } from '../../domain/types/api.types'

/**
 * Axios client instance với interceptors
 */
class ApiClient {
  private client: AxiosInstance
  private isRefreshing = false
  private refreshSubscribers: ((token: string) => void)[] = []

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor - Thêm token vào headers
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const { tokenStorage } = await import('../../../../app/features/auth/utils/token-storage')
        const token = tokenStorage.getAccessToken()
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        // Khi gửi FormData, để browser tự set Content-Type kèm boundary (multipart/form-data; boundary=...)
        if (config.data instanceof FormData && config.headers) {
          delete config.headers['Content-Type']
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - Handle errors và refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Handle 401 Unauthorized - Refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Đợi refresh token hoàn thành
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`
                }
                resolve(this.client(originalRequest))
              })
            })
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            const { tokenStorage } = await import('../../../../app/features/auth/utils/token-storage')
            const refreshToken = tokenStorage.getRefreshToken()
            if (!refreshToken) {
              throw AppError.unauthorized('No refresh token')
            }

            // Call refresh token API
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            })

            const payload = (response.data as any).data || response.data
            const { access_token, refresh_token } = payload

            // Save new tokens
            tokenStorage.setAccessToken(access_token)
            tokenStorage.setRefreshToken(refresh_token)

            // Notify all subscribers
            this.refreshSubscribers.forEach((callback) => callback(access_token))
            this.refreshSubscribers = []

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`
            }
            return this.client(originalRequest)
          } catch (refreshError) {
            // Refresh failed - Clear tokens and update store
            const { tokenStorage } = await import('../../../../app/features/auth/utils/token-storage')
            const { useAuthStore } = await import('../../../../app/features/auth/store/auth.store')

            // Clear all tokens from storage
            tokenStorage.clearAll()

            // Update zustand session store to unauthenticated
            useAuthStore.setState({
              user: null,
              isAuthenticated: false,
              error: null,
            })

            // Redirect to login
            window.location.href = '/login'
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        // Transform error
        const appError = this.transformError(error)
        return Promise.reject(appError)
      }
    )
  }

  private transformError(error: AxiosError<ApiError>): AppError {
    if (error.response) {
      const { status, data } = error.response
      const message = data?.message || error.message
      return new AppError(message, status)
    }

    if (error.request) {
      return new AppError('Network error. Please check your connection.', 0)
    }

    return new AppError(error.message)
  }

  getInstance(): AxiosInstance {
    return this.client
  }
}

// Export singleton instance
export const apiClient = new ApiClient().getInstance()
