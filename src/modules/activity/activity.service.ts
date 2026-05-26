import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, ActivityAction } from './entities/activity-log.entity';
import { OrganizationsService } from '../organizations/organizations.service';
import { CacheService } from '../../cache/cache.service';
import { EventsService } from '../gateway/events.service';


export interface LogActivityParams {
  action: ActivityAction;
  entityType: string;
  entityId: string;
  organizationId: string;
  actorId: string;
  metadata?: Record<string, any>;
}

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
    limit = 50,
  ): Promise<ActivityLog[]> {
    await this.orgsService.verifyMembership(orgId, requesterId);

    const cacheKey = this.cacheService.keys.orgActivity(orgId);

    // Try cache first
    const cached = await this.cacheService.get<ActivityLog[]>(cacheKey);
    if (cached) {
      return cached;  // cache hit — return immediately, no DB query
    }

    // Cache miss — query DB
    const logs = await this.activityRepository.find({
      where: { organizationId: orgId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    // Store in cache for 60 seconds
    await this.cacheService.set(cacheKey, logs, 60);

    return logs;
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