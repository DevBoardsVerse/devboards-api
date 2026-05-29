import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
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
  async getOrgActivity(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.activityService.getOrgActivity(orgId, user.id, limit, page);
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