import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators';

/**
 * Optional JWT Auth Guard
 *
 * Cho phép request có hoặc không có token:
 * - Nếu có token hợp lệ → gán req.user
 * - Nếu không có token hoặc token invalid → req.user = undefined, không throw error
 *
 * Use case: Endpoint public nhưng muốn customize response dựa trên user context
 * Ví dụ: GET /vocabularies/lesson/:id - trả về dialect preference nếu user đăng nhập
 *
 * IMPORTANT: Endpoint sử dụng guard này PHẢI có @Public() decorator để skip global JwtAuthGuard
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // This guard should only be used on @Public() endpoints
    if (!isPublic) {
      console.warn(
        'OptionalJwtAuthGuard used without @Public() decorator - this may cause issues',
      );
    }

    try {
      // Try to authenticate if token is present
      const result = await super.canActivate(context);
      return result as boolean;
    } catch (_err) {
      // If authentication fails, that's OK for optional auth
      // We'll just continue without a user
      // Return true to allow the request to proceed
      return true;
    }
  }

  handleRequest(err: any, user: any) {
    // Return user if exists, null otherwise
    // Never throw an error - this is the key difference from JwtAuthGuard
    if (err || !user) {
      return null;
    }
    return user;
  }
}
