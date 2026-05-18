import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/user.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Module({
  
  imports: [
    UsersModule,   // gives AuthService access to UsersService
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    // Empty config here — we pass secret/expiry per-call in AuthService
    // This is intentional: access and refresh tokens use different secrets
  ],

  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenStrategy
  ],

  controllers: [AuthController],

  exports: [AuthService],

})
export class AuthModule {}
