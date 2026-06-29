import { LocalStorage } from '../../../../lib/core/infrastructure/storage/LocalStorage'
import { STORAGE_KEYS } from '../../../../lib/shared/constants'
import type { User } from '../../../../lib/core/domain/entities/User'

/**
 * Token storage helpers for auth tokens and user data
 * Wraps LocalStorage with specific keys for easier testing and maintenance
 */

export const tokenStorage = {
  /**
   * Get access token from storage
   */
  getAccessToken(): string | null {
    return LocalStorage.get<string>(STORAGE_KEYS.ACCESS_TOKEN)
  },

  /**
   * Set access token in storage
   */
  setAccessToken(token: string): void {
    LocalStorage.set(STORAGE_KEYS.ACCESS_TOKEN, token)
  },

  /**
   * Remove access token from storage
   */
  removeAccessToken(): void {
    LocalStorage.remove(STORAGE_KEYS.ACCESS_TOKEN)
  },

  /**
   * Get refresh token from storage
   */
  getRefreshToken(): string | null {
    return LocalStorage.get<string>(STORAGE_KEYS.REFRESH_TOKEN)
  },

  /**
   * Set refresh token in storage
   */
  setRefreshToken(token: string): void {
    LocalStorage.set(STORAGE_KEYS.REFRESH_TOKEN, token)
  },

  /**
   * Remove refresh token from storage
   */
  removeRefreshToken(): void {
    LocalStorage.remove(STORAGE_KEYS.REFRESH_TOKEN)
  },

  /**
   * Get user data from storage
   */
  getUser(): User | null {
    return LocalStorage.get<User>(STORAGE_KEYS.USER)
  },

  /**
   * Set user data in storage
   */
  setUser(user: User): void {
    LocalStorage.set(STORAGE_KEYS.USER, user)
  },

  /**
   * Remove user data from storage
   */
  removeUser(): void {
    LocalStorage.remove(STORAGE_KEYS.USER)
  },

  /**
   * Clear all auth data from storage
   */
  clearAll(): void {
    LocalStorage.remove(STORAGE_KEYS.ACCESS_TOKEN)
    LocalStorage.remove(STORAGE_KEYS.REFRESH_TOKEN)
    LocalStorage.remove(STORAGE_KEYS.USER)
  },
}
