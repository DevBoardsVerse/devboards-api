import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

import { UseGuards } from '@nestjs/common';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';

import { Public } from '../../common/decorators/roles.decorator';

import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  
  @Public()
  @Post('register')
  @Throttle({ auth: { ttl: 60000, limit: 5 } })
  // 5 registration attempts per minute per IP  
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Email already registered' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)   // POST defaults to 201, login should return 200
  @Throttle({ auth: { ttl: 60000, limit: 10 } })
  // 10 login attempts per minute per IP
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

@Public()                           // uses RefreshTokenGuard directly, not JwtAuthGuard
@Post('refresh')
@HttpCode(HttpStatus.OK)
@UseGuards(RefreshTokenGuard)       // uses jwt-refresh strategy
@ApiBearerAuth('access-token')      // Swagger lock icon
@ApiOperation({
  summary: 'Refresh access token',
  description:
    'Send your refresh token as Bearer token to get a new token pair. Old refresh token is immediately invalidated.',
})
@ApiOkResponse({
  description: 'New token pair issued',
  type: AuthResponseDto,
})
@ApiForbiddenResponse({
  description: 'Invalid, expired, or already-used refresh token',
})
async refresh(@CurrentUser() user: any) {
  // user here has shape: { sub, email, role, refreshToken }
  // set by RefreshTokenStrategy.validate()
  return this.authService.refreshTokens(user.sub, user.refreshToken);
}

@Post('logout')
@HttpCode(HttpStatus.OK)
@UseGuards(JwtAuthGuard)            // must be logged in to logout
@ApiBearerAuth('access-token')
@ApiOperation({
  summary: 'Logout current user',
  description: 'Invalidates the refresh token. Access token expires naturally.',
})
@ApiOkResponse({ description: 'Logged out successfully' })
@ApiUnauthorizedResponse({ description: 'Not authenticated' })
async logout(@CurrentUser() user: any) {
  await this.authService.logout(user.id);
  return { message: 'Logged out successfully' };
}
}