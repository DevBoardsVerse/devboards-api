import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './user.service';
import { User } from './entities/user.entity';

import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)        // protect this endpoint
  @ApiBearerAuth('access-token')  // show lock icon in Swagger
  @ApiOperation({ summary: 'Get current logged in user profile' })
  @ApiOkResponse({ description: 'Returns the authenticated user' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  getProfile(@CurrentUser() user: Omit<User, 'password'>) {
    return { user };
  }

@Get('admin/all')
@Roles(UserRole.ADMIN)              // only admins
@ApiBearerAuth('access-token')
@ApiOperation({ summary: 'Admin only — get all users' })
@ApiForbiddenResponse({ description: 'Requires admin role' })
async getAllUsers() {
  return { message: 'Admin access confirmed' };
}
}