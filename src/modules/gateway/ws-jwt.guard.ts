import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UsersService } from '../users/user.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    // Token can come from auth header or handshake query (?token=...)
    // query param is the fallback for browser clients that can't set headers
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '') ||
      client.handshake.query?.token;

    if (!token) {
      throw new WsException('Missing auth token');
    }

    try {
      const payload = this.jwtService.verify(token as string, {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new WsException('User not found or deactivated');
      }

      // Attach user to socket data — available in gateway handlers
      client.data.user = this.usersService.sanitize(user);
      return true;
    } catch {
      throw new WsException('Invalid or expired token');
    }
  }
}