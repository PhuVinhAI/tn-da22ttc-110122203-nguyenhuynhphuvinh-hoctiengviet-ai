import type { User } from '../../../core/domain/entities/User'
import { Role } from '../../../core/domain/enums'

/**
 * Check if a user has the ADMIN role
 * @param user - User object to check
 * @returns true if user has ADMIN role, false otherwise
 */
export function hasAdminRole(user: User | null | undefined): boolean {
  if (!user || !user.roles) {
    return false
  }

  return user.roles.some((role) => role.name === Role.ADMIN)
}
