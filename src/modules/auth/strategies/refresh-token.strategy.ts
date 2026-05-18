import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',  // different name from 'jwt' — critical
) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.refreshSecret'),

      // passReqToCallback: true means the raw request object
      // is passed as first argument to validate()
      // We need this to extract the raw refresh token string
      // so we can compare it against the Redis hash later
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; email: string; role: string }) {
    // Extract the raw token from the Authorization header
    // format: "Bearer <token>" — split and take index 1
    const authHeader = req.get('Authorization');
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const refreshToken = authHeader.split(' ')[1];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    // Attach both the payload AND the raw token to request.user
    // AuthService needs the raw token to compare against Redis hash
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken,   // raw token — will be compared against Redis hash
    };
  }
}