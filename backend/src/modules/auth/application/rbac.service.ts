import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../domain/role.entity';
import { Permission } from '../domain/permission.entity';
import {
  Role as RoleEnum,
  Permission as PermissionEnum,
} from '../../../common/enums';
import { LoggingService } from '../../../infrastructure/logging/logging.service';

@Injectable()
export class RbacService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private loggingService: LoggingService,
  ) {}

  async onModuleInit() {
    await this.seedRolesAndPermissions();
  }

  private async seedRolesAndPermissions() {
    try {
      // Seed all permissions
      const permissions = await this.seedPermissions();

      // Seed roles with permissions
      await this.seedRoles(permissions);

      this.loggingService.log('RBAC seeded successfully', 'RbacService');
    } catch (error) {
      this.loggingService.error(
        'Failed to seed RBAC',
        error.stack,
        'RbacService',
      );
    }
  }

  private async seedPermissions(): Promise<Map<PermissionEnum, Permission>> {
    const permissionMap = new Map<PermissionEnum, Permission>();

    const permissionDefinitions = [
      // User permissions
      {
        name: PermissionEnum.USER_CREATE,
        description: 'Tạo user mới',
        category: 'user',
      },
      {
        name: PermissionEnum.USER_READ,
        description: 'Xem thông tin user',
        category: 'user',
      },
      {
        name: PermissionEnum.USER_UPDATE,
        description: 'Cập nhật user',
        category: 'user',
      },
      {
        name: PermissionEnum.USER_DELETE,
        description: 'Xóa user',
        category: 'user',
      },
      {
        name: PermissionEnum.USER_LIST,
        description: 'Xem danh sách users',
        category: 'user',
      },
      {
        name: PermissionEnum.USER_MANAGE_ROLES,
        description: 'Quản lý roles của user',
        category: 'user',
      },

      // Course permissions
      {
        name: PermissionEnum.COURSE_CREATE,
        description: 'Tạo khóa học',
        category: 'course',
      },
      {
        name: PermissionEnum.COURSE_READ,
        description: 'Xem khóa học',
        category: 'course',
      },
      {
        name: PermissionEnum.COURSE_UPDATE,
        description: 'Cập nhật khóa học',
        category: 'course',
      },
      {
        name: PermissionEnum.COURSE_DELETE,
        description: 'Xóa khóa học',
        category: 'course',
      },
      {
        name: PermissionEnum.COURSE_LIST,
        description: 'Xem danh sách khóa học',
        category: 'course',
      },
      {
        name: PermissionEnum.COURSE_PUBLISH,
        description: 'Publish khóa học',
        category: 'course',
      },

      // Module permissions
      {
        name: PermissionEnum.MODULE_CREATE,
        description: 'Tạo module',
        category: 'module',
      },
      {
        name: PermissionEnum.MODULE_READ,
        description: 'Xem module',
        category: 'module',
      },
      {
        name: PermissionEnum.MODULE_UPDATE,
        description: 'Cập nhật module',
        category: 'module',
      },
      {
        name: PermissionEnum.MODULE_DELETE,
        description: 'Xóa module',
        category: 'module',
      },

      // Lesson permissions
      {
        name: PermissionEnum.LESSON_CREATE,
        description: 'Tạo lesson',
        category: 'lesson',
      },
      {
        name: PermissionEnum.LESSON_READ,
        description: 'Xem lesson',
        category: 'lesson',
      },
      {
        name: PermissionEnum.LESSON_UPDATE,
        description: 'Cập nhật lesson',
        category: 'lesson',
      },
      {
        name: PermissionEnum.LESSON_DELETE,
        description: 'Xóa lesson',
        category: 'lesson',
      },

      // Exercise permissions
      {
        name: PermissionEnum.EXERCISE_CREATE,
        description: 'Tạo exercise',
        category: 'exercise',
      },
      {
        name: PermissionEnum.EXERCISE_READ,
        description: 'Xem exercise',
        category: 'exercise',
      },
      {
        name: PermissionEnum.EXERCISE_UPDATE,
        description: 'Cập nhật exercise',
        category: 'exercise',
      },
      {
        name: PermissionEnum.EXERCISE_DELETE,
        description: 'Xóa exercise',
        category: 'exercise',
      },
      {
        name: PermissionEnum.EXERCISE_SUBMIT,
        description: 'Submit exercise',
        category: 'exercise',
      },

      // Vocabulary permissions
      {
        name: PermissionEnum.VOCABULARY_CREATE,
        description: 'Tạo vocabulary',
        category: 'vocabulary',
      },
      {
        name: PermissionEnum.VOCABULARY_READ,
        description: 'Xem vocabulary',
        category: 'vocabulary',
      },
      {
        name: PermissionEnum.VOCABULARY_UPDATE,
        description: 'Cập nhật vocabulary',
        category: 'vocabulary',
      },
      {
        name: PermissionEnum.VOCABULARY_DELETE,
        description: 'Xóa vocabulary',
        category: 'vocabulary',
      },

      // Grammar permissions
      {
        name: PermissionEnum.GRAMMAR_CREATE,
        description: 'Tạo grammar rule',
        category: 'grammar',
      },
      {
        name: PermissionEnum.GRAMMAR_READ,
        description: 'Xem grammar rule',
        category: 'grammar',
      },
      {
        name: PermissionEnum.GRAMMAR_UPDATE,
        description: 'Cập nhật grammar rule',
        category: 'grammar',
      },
      {
        name: PermissionEnum.GRAMMAR_DELETE,
        description: 'Xóa grammar rule',
        category: 'grammar',
      },

      // Progress permissions
      {
        name: PermissionEnum.PROGRESS_READ,
        description: 'Xem progress của mình',
        category: 'progress',
      },
      {
        name: PermissionEnum.PROGRESS_UPDATE,
        description: 'Cập nhật progress',
        category: 'progress',
      },
      {
        name: PermissionEnum.PROGRESS_DELETE,
        description: 'Xóa progress',
        category: 'progress',
      },
      {
        name: PermissionEnum.PROGRESS_VIEW_ALL,
        description: 'Xem progress của tất cả users',
        category: 'progress',
      },

      // Content permissions
      {
        name: PermissionEnum.CONTENT_CREATE,
        description: 'Tạo content',
        category: 'content',
      },
      {
        name: PermissionEnum.CONTENT_READ,
        description: 'Xem content',
        category: 'content',
      },
      {
        name: PermissionEnum.CONTENT_UPDATE,
        description: 'Cập nhật content',
        category: 'content',
      },
      {
        name: PermissionEnum.CONTENT_DELETE,
        description: 'Xóa content',
        category: 'content',
      },

      // System permissions
      {
        name: PermissionEnum.SYSTEM_SETTINGS,
        description: 'Quản lý system settings',
        category: 'system',
      },
      {
        name: PermissionEnum.SYSTEM_LOGS,
        description: 'Xem system logs',
        category: 'system',
      },
      {
        name: PermissionEnum.CACHE_MANAGE,
        description: 'Quản lý cache',
        category: 'system',
      },
    ];

    for (const def of permissionDefinitions) {
      let permission = await this.permissionRepository.findOne({
        where: { name: def.name },
      });

      if (!permission) {
        permission = this.permissionRepository.create(def);
        await this.permissionRepository.save(permission);
      }

      permissionMap.set(def.name, permission);
    }

    return permissionMap;
  }

  private async seedRoles(permissionMap: Map<PermissionEnum, Permission>) {
    // USER role - basic permissions
    const userPermissions = [
      PermissionEnum.COURSE_READ,
      PermissionEnum.COURSE_LIST,
      PermissionEnum.MODULE_READ,
      PermissionEnum.LESSON_READ,
      PermissionEnum.EXERCISE_READ,
      PermissionEnum.EXERCISE_SUBMIT,
      PermissionEnum.VOCABULARY_READ,
      PermissionEnum.GRAMMAR_READ,
      PermissionEnum.PROGRESS_READ,
      PermissionEnum.PROGRESS_UPDATE,
      PermissionEnum.CONTENT_READ,
    ]
      .map((p) => permissionMap.get(p))
      .filter((p): p is Permission => p !== undefined);

    await this.createOrUpdateRole(
      RoleEnum.USER,
      'Người dùng thông thường',
      userPermissions,
    );

    // ADMIN role - all permissions
    const allPermissions = Array.from(permissionMap.values());
    await this.createOrUpdateRole(
      RoleEnum.ADMIN,
      'Quản trị viên hệ thống',
      allPermissions,
    );
  }

  private async createOrUpdateRole(
    name: RoleEnum,
    description: string,
    permissions: Permission[],
  ) {
    let role = await this.roleRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });

    if (!role) {
      role = this.roleRepository.create({ name, description });
    } else {
      role.description = description;
    }

    role.permissions = permissions;
    await this.roleRepository.save(role);
  }

  hasPermission(_userId: string, _permission: PermissionEnum): boolean {
    return false;
  }

  hasAnyPermission(_userId: string, _permissions: PermissionEnum[]): boolean {
    return false;
  }
}
