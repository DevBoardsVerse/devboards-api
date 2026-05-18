import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/user.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

import { ForbiddenException } from '@nestjs/common';



@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    // UsersService.create already checks for duplicate email
    const user = await this.usersService.create(dto);
    const tokens = await this.generateTokens(user);

    // Store refresh token in Redis straight after register
    // so the user is logged in immediately
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.usersService.sanitize(user),
      tokens,
    };
  }

  async login(dto: LoginDto) {
    // 1. Find user
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Same error for wrong email AND wrong password
      // Never tell the caller which one was wrong — security best practice
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Compare submitted password against stored hash
    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Check account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // 4. Generate tokens
    const tokens = await this.generateTokens(user);

    // 5. Store refresh token in Redis
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.usersService.sanitize(user),
      tokens,
    };
  }

  // ─── Token helpers ───────────────────────────────────────────

  async generateTokens(user: User) {
    // The JWT payload — what gets embedded inside the token
    // Keep it small — just what you need to identify the user
    const payload = {
      sub: user.id,       // 'sub' is JWT standard for subject (user id)
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
        expiresIn:
          (this.configService.get<string>('jwt.expiresIn') ??
            '15m') as StringValue,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn:
          (this.configService.get<string>('jwt.refreshExpiresIn') ??
            '7d') as StringValue,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    // Hash the refresh token before storing in Redis
    // If Redis is compromised, raw tokens can't be used directly
    const hashedToken = await bcrypt.hash(refreshToken, 10);

    // Store with 7 day TTL — Redis auto-deletes after expiry
    // Key pattern: refresh_token:{userId}
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
    await this.redisService.set(
      `refresh_token:${userId}`,
      hashedToken,
      ttl,
    );
  }

  async refreshTokens(userId: string, submittedRefreshToken: string) {
  // 1. Get the stored hash from Redis
  const storedHash = await this.redisService.get(`refresh_token:${userId}`);

  if (!storedHash) {
    // Key missing — user logged out or token expired
    throw new ForbiddenException('Access denied — please login again');
  }

  // 2. Compare submitted token against stored hash
  // bcrypt.compare handles the hash comparison
  const tokenMatches = await bcrypt.compare(
    submittedRefreshToken,
    storedHash,
  );

  if (!tokenMatches) {
    // Hash mismatch — token was already rotated
    // This means either:
    //   a) Token reuse detected (possible theft)
    //   b) Client sent wrong token
    // Either way — invalidate everything, force re-login
    await this.redisService.delete(`refresh_token:${userId}`);
    throw new ForbiddenException(
      'Refresh token reuse detected — please login again',
    );
  }

  // 3. Get the full user to generate tokens with fresh data
  const user = await this.usersService.findById(userId);
  if (!user || !user.isActive) {
    throw new ForbiddenException('Access denied');
  }

  // 4. Generate new token pair
  const tokens = await this.generateTokens(user);

  // 5. Store new refresh token — overwrites the old hash in Redis
  await this.storeRefreshToken(userId, tokens.refreshToken);

  return {
    user: this.usersService.sanitize(user),
    tokens,
  };
}

async logout(userId: string): Promise<void> {
  // Simply delete the refresh token from Redis
  // Access token remains valid until expiry (max 15 min)
  // but without a refresh token the session cannot be extended
  await this.redisService.delete(`refresh_token:${userId}`);
}
}