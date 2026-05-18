import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/user.service';

// The payload shape that gets decoded from the JWT
// This is what you put INTO the token when signing in AuthService
export interface JwtPayload {
  sub: string;    // userId
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  // 'jwt' is the strategy name — JwtAuthGuard references this name

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      // Tell Passport WHERE to find the token in the request
      // fromAuthHeaderAsBearerToken() looks for:
      // Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // If token is expired, reject it — don't even call validate()
      ignoreExpiration: false,

      // The secret used to VERIFY the token signature
      // Must match the secret used to SIGN it in AuthService
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  // Passport calls this automatically after verifying the token signature
  // payload = the decoded JWT body: { sub, email, role, iat, exp }
  // Whatever you return here gets attached to request.user
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Return the user — NestJS attaches this to request.user
    // We sanitize to make sure password never ends up in request.user
    return this.usersService.sanitize(user);
  }
}