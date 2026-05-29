import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, ActivityAction } from './entities/activity-log.entity';
import { OrganizationsService } from '../organizations/organizations.service';
import { CacheService } from '../../cache/cache.service';
import { EventsService } from '../gateway/events.service';
import { In } from 'typeorm';


export interface LogActivityParams {
  action: ActivityAction;
  entityType: string;
  entityId: string;
  organizationId: string;
  actorId: string;
  metadata?: Record<string, any>;
}

const CATEGORY_ACTIONS: Record<string, ActivityAction[]> = {
  tasks: [
    ActivityAction.TASK_CREATED,
    ActivityAction.TASK_UPDATED,
    ActivityAction.TASK_STATUS_CHANGED,
    ActivityAction.TASK_ASSIGNED,
    ActivityAction.TASK_DELETED,
  ],
  members: [
    ActivityAction.MEMBER_INVITED,
    ActivityAction.MEMBER_ROLE_CHANGED,
    ActivityAction.MEMBER_REMOVED,
  ],
  projects: [
    ActivityAction.PROJECT_CREATED,
  ],
};

@Injectable()
export class ActivityService {
  // Logger is NestJS built-in — logs to console with context label
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectRepository(ActivityLog)
    private activityRepository: Repository<ActivityLog>,
    private orgsService: OrganizationsService,
    private cacheService: CacheService,  //added for caching
    private eventsService : EventsService, //added for websocket
  ) {}

  // ─── Write ───────────────────────────────────────────────────

  async log(params: LogActivityParams): Promise<void> {
    try {
      const entry = this.activityRepository.create(params);
      await this.activityRepository.save(entry);
      this.eventsService.emitToOrg(params.organizationId, 'activity.new', entry);
       
      // Invalidate org activity cache — next request will get fresh data
      await this.cacheService.delete(
        this.cacheService.keys.orgActivity(params.organizationId),
      );
    } catch (error) {
      // Never let a logging failure crash the main operation
      // Just record the error and continue
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Failed to log activity: ${params.action}`,
        err.stack,
      );
    }
  }

  // ─── Read ─────────────────────────────────────────────────────

  async getOrgActivity(
    orgId: string,
    requesterId: string,
    limit = 20,
    page = 1,
    category?: string,
  ): Promise<{ logs: ActivityLog[]; total: number; page: number; limit: number }> {
    await this.orgsService.verifyMembership(orgId, requesterId);

    // Only cache unfiltered page 1
    if (page === 1 && !category) {
      const cacheKey = this.cacheService.keys.orgActivity(orgId);
      const cached = await this.cacheService.get<{
        logs: ActivityLog[];
        total: number;
        page: number;
        limit: number;
      }>(cacheKey);
      if (cached) return cached;
    }

    const actions = category ? CATEGORY_ACTIONS[category] : undefined;

    const [logs, total] = await this.activityRepository.findAndCount({
      where: {
        organizationId: orgId,
        ...(actions ? { action: In(actions) } : {}),
      },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const result = { logs, total, page, limit };

    if (page === 1 && !category) {
      await this.cacheService.set(
        this.cacheService.keys.orgActivity(orgId),
        result,
        60,
      );
    }

    return result;
  }

  async getEntityActivity(
    orgId: string,
    entityType: string,
    entityId: string,
    requesterId: string,
  ): Promise<ActivityLog[]> {
    // Verify membership before returning any activity
    await this.orgsService.verifyMembership(orgId, requesterId);

    return this.activityRepository.find({
      where: { organizationId: orgId, entityType, entityId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
    });
  }
}