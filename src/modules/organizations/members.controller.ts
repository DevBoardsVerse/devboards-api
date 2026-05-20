import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { MembersService } from './members.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('organizations')
@ApiBearerAuth('access-token')
@Controller('organizations/:orgId/members')
// Note the nested route: /organizations/:orgId/members
// orgId comes from the parent route segment
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  @ApiOperation({ summary: 'List all members of an organization' })
  @ApiOkResponse({ description: 'Member list returned' })
  @ApiForbiddenResponse({ description: 'Not a member of this org' })
  async listMembers(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
  ) {
    return this.membersService.listMembers(orgId, user.id);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a user by email — Owner or Admin only' })
  @ApiCreatedResponse({ description: 'User added to organization' })
  @ApiForbiddenResponse({ description: 'Insufficient role or privilege escalation' })
  @ApiNotFoundResponse({ description: 'Target user not found' })
  @ApiConflictResponse({ description: 'User already a member' })
  async invite(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.membersService.invite(orgId, user.id, dto);
  }

  @Patch(':userId/role')
  @ApiOperation({ summary: 'Update a member role — Owner or Admin only' })
  @ApiForbiddenResponse({ description: 'Insufficient role or privilege escalation' })
  @ApiNotFoundResponse({ description: 'Target user not a member' })
  async updateRole(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.membersService.updateRole(orgId, user.id, targetUserId, dto);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member — Owner or Admin only' })
  @ApiForbiddenResponse({ description: 'Insufficient role or privilege escalation' })
  @ApiNotFoundResponse({ description: 'Target user not a member' })
  async removeMember(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.membersService.removeMember(orgId, user.id, targetUserId);
  }
}