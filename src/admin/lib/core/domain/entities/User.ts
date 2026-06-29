import { Role, UserLevel } from '../enums';

export interface RoleEntity {
  id: string;
  name: Role;
  description: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  nativeLanguage: string;
  currentLevel: UserLevel;
  avatarUrl?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  roles: RoleEntity[];
  createdAt: string;
  updatedAt: string;
}
