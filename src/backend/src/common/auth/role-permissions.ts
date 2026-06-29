import { Permission, Role } from '../enums';

export type RoleView = {
  id: Role;
  name: Role;
  description: string;
  permissions: Array<{ name: Permission }>;
};

type UserRoleCarrier = {
  role?: unknown;
  roles?: unknown;
};

const USER_PERMISSIONS: readonly Permission[] = [
  Permission.COURSE_READ,
  Permission.COURSE_LIST,
  Permission.MODULE_READ,
  Permission.LESSON_READ,
  Permission.EXERCISE_READ,
  Permission.EXERCISE_SUBMIT,
  Permission.VOCABULARY_READ,
  Permission.GRAMMAR_READ,
  Permission.PROGRESS_READ,
  Permission.PROGRESS_UPDATE,
  Permission.CONTENT_READ,
  Permission.AI_CHAT,
  Permission.AI_GENERATE_EXERCISE,
  Permission.AI_CORRECT_GRAMMAR,
  Permission.AI_VIEW_CONVERSATIONS,
  Permission.SIMULATION_ACCESS,
];

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.USER]: 'Standard user',
  [Role.ADMIN]: 'System administrator',
};

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.USER]: USER_PERMISSIONS,
  [Role.ADMIN]: Object.values(Permission),
};

export function normalizeRole(value: unknown): Role | null {
  if (value === Role.USER || value === Role.ADMIN) {
    return value;
  }

  return null;
}

export function getPermissionsForRole(value: unknown): Permission[] {
  const role = normalizeRole(value);
  return role ? [...ROLE_PERMISSIONS[role]] : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getRoleNamesForUser(user: unknown): Role[] {
  const source: UserRoleCarrier = isRecord(user) ? user : {};
  const roles = new Set<Role>();
  const directRole = normalizeRole(source.role);

  if (directRole) {
    roles.add(directRole);
  }

  if (Array.isArray(source.roles)) {
    for (const role of source.roles) {
      const normalized = normalizeRole(isRecord(role) ? role.name : role);

      if (normalized) {
        roles.add(normalized);
      }
    }
  }

  return Array.from(roles);
}

export function getPermissionsForUser(user: unknown): Permission[] {
  const permissions = new Set<Permission>();

  for (const role of getRoleNamesForUser(user)) {
    for (const permission of ROLE_PERMISSIONS[role]) {
      permissions.add(permission);
    }
  }

  return Array.from(permissions);
}

export function getRoleView(value: unknown): RoleView {
  const role = normalizeRole(value) ?? Role.USER;

  return {
    id: role,
    name: role,
    description: ROLE_DESCRIPTIONS[role],
    permissions: ROLE_PERMISSIONS[role].map((name) => ({ name })),
  };
}
