import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Read what roles are required for this route
    // getAllAndOverride checks the method first, then the class
    // so method-level @Roles() overrides class-level @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [
        context.getHandler(), // method decorator
        context.getClass(),   // class decorator
      ],
    );

    // 2. If no @Roles() decorator on this route — allow everyone through
    // This means RolesGuard is safe to apply globally:
    // routes without @Roles() are unaffected
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Get the user from request
    // JwtAuthGuard must run BEFORE RolesGuard to populate request.user
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('No user found on request');
    }

    // 4. Check if user's role is in the required roles list
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied — requires role: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}