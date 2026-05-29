import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('activity')
@ApiBearerAuth('access-token')
@Controller('organizations/:orgId/activity')
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get()
  @ApiOperation({ summary: 'Get recent activity for an organization' })
  @ApiOkResponse({ description: 'Activity feed returned' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'category', required: false, enum: ['tasks', 'members', 'projects'] })
  async getOrgActivity(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('category') category?: string,
  ) {
    return this.activityService.getOrgActivity(orgId, user.id, limit, page, category);
  }

  @Get(':entityType/:entityId')
  @ApiOperation({ summary: 'Get activity for a specific resource' })
  @ApiOkResponse({ description: 'Resource activity returned' })
  async getEntityActivity(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    return this.activityService.getEntityActivity(
      orgId,
      entityType,
      entityId,
      user.id,
    );
  }
}