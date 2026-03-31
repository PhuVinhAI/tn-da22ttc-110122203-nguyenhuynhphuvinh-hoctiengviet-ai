import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from '../../../shared/constants';
import { LocalStorage } from '../storage/LocalStorage';
import { AppError } from '../../../shared/errors/AppError';
import type { ApiError } from '../../domain/types/api.types';

/**
 * Axios client instance với interceptors
 */
class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Thêm token vào headers
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = LocalStorage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors và refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - Refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Đợi refresh token hoàn thành
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = LocalStorage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) {
              throw AppError.unauthorized('No refresh token');
            }

            // Call refresh token API
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { access_token, refresh_token } = response.data;

            // Save new tokens
            LocalStorage.set(STORAGE_KEYS.ACCESS_TOKEN, access_token);
            LocalStorage.set(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);

            // Notify all subscribers
            this.refreshSubscribers.forEach((callback) => callback(access_token));
            this.refreshSubscribers = [];

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - Logout user
            LocalStorage.remove(STORAGE_KEYS.ACCESS_TOKEN);
            LocalStorage.remove(STORAGE_KEYS.REFRESH_TOKEN);
            LocalStorage.remove(STORAGE_KEYS.USER);
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Transform error
        const appError = this.transformError(error);
        return Promise.reject(appError);
      }
    );
  }

  private transformError(error: AxiosError<ApiError>): AppError {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || error.message;
      return new AppError(message, status);
    }

    if (error.request) {
      return new AppError('Network error. Please check your connection.', 0);
    }

    return new AppError(error.message);
  }

  getInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new ApiClient().getInstance();
