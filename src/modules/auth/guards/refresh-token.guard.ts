import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  // 'jwt-refresh' matches the strategy name above

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      const message = info?.message === 'jwt expired'
        ? 'Refresh token has expired — please login again'
        : 'Invalid or missing refresh token';

      throw err || new UnauthorizedException(message);
    }
    return user;
  }
}