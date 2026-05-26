import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators/roles.decorator';
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // 'jwt' here matches the strategy name in JwtStrategy

   constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if the route has @Public() — if so skip JWT check entirely
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Otherwise run normal JWT verification
    return super.canActivate(context);
  }

  // Override handleRequest to customize the error message
  // By default Passport throws a generic error — this makes it cleaner
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      // info.message gives you: 'jwt expired', 'invalid token' etc
      const message = info?.message === 'jwt expired'
        ? 'Token has expired — please login again'
        : 'Invalid or missing token';

      throw err || new UnauthorizedException(message);
    }
    return user;
  }
}