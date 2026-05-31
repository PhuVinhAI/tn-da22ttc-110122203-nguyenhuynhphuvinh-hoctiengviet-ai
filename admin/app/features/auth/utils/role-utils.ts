import type { User } from '../../../../lib/core/domain/entities/User'
import { Role } from '../../../../lib/core/domain/enums'

/**
 * Check if a user has the ADMIN role
 * @param user - User object to check
 * @returns true if user has ADMIN role, false otherwise
 */
export function hasAdminRole(user: User | null | undefined): boolean {
  if (!user) {
    return false
  }

  // Check both role (string) and roles (array) for compatibility
  if (typeof (user as any).role === 'string') {
    return (user as any).role === Role.ADMIN
  }

  if (user.roles) {
    return user.roles.some((role) => role.name === Role.ADMIN)
  }

  return false
}
