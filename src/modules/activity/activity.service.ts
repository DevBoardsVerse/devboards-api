import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, ActivityAction } from './entities/activity-log.entity';
import { OrganizationsService } from '../organizations/organizations.service';

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
  ) {}

  // ─── Write ───────────────────────────────────────────────────

  async log(params: LogActivityParams): Promise<void> {
    try {
      const entry = this.activityRepository.create(params);
      await this.activityRepository.save(entry);
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
    // Any org member can see activity
    await this.orgsService.verifyMembership(orgId, requesterId);

    return this.activityRepository.find({
      where: { organizationId: orgId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
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