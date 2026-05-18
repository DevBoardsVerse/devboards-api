import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../modules/users/entities/user.entity';

// createParamDecorator creates a decorator that extracts
// something from the request and injects it as a parameter

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Omit<User, 'password'> => {
    const request = ctx.switchToHttp().getRequest();
    // request.user was set by JwtStrategy.validate()
    return request.user;
  },
);