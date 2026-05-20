import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { OrganizationsService } from '../organizations/organizations.service';
import { OrgRole } from '../organizations/entities/organization-member.entity';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction } from '../activity/entities/activity-log.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,

    // Injected so we can reuse verifyMembership and verifyRole
    // instead of rewriting permission logic from scratch
    private orgsService: OrganizationsService,
    private activityService: ActivityService,
  ) {}

  // ─── Create ──────────────────────────────────────────────────

  async create(
    orgId: string,
    userId: string,
    dto: CreateProjectDto,
  ): Promise<Project> {
    // Only Owner or Admin can create projects
    await this.orgsService.verifyRole(orgId, userId, [
      OrgRole.OWNER,
      OrgRole.ADMIN,
    ]);

    const project = this.projectRepository.create({
      ...dto,
      organizationId: orgId,
      createdById: userId,
    });

    const savedProject = await this.projectRepository.save(project);

    await this.activityService.log({
      action: ActivityAction.PROJECT_CREATED,
      entityType: 'Organization',
      entityId: orgId,
      organizationId: orgId,
      actorId: userId,
      metadata: { projectId: savedProject.id, name: savedProject.name },
    });

    return savedProject;
  }

  // ─── Read ─────────────────────────────────────────────────────

  async findAll(orgId: string, userId: string): Promise<Project[]> {
    // Any member can list projects
    await this.orgsService.verifyMembership(orgId, userId);

    return this.projectRepository.find({
      where: { organizationId: orgId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    orgId: string,
    projectId: string,
    userId: string,
  ): Promise<Project> {
    // Any member can view a project
    await this.orgsService.verifyMembership(orgId, userId);

    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId: orgId },
      relations: ['createdBy', 'organization'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  // ─── Update ──────────────────────────────────────────────────

  async update(
    orgId: string,
    projectId: string,
    userId: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    // Only Owner or Admin can update
    await this.orgsService.verifyRole(orgId, userId, [
      OrgRole.OWNER,
      OrgRole.ADMIN,
    ]);

    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId: orgId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    Object.assign(project, dto);
    const updatedProject = await this.projectRepository.save(project);

    await this.activityService.log({
      action: ActivityAction.PROJECT_UPDATED,
      entityType: 'Organization',
      entityId: orgId,
      organizationId: orgId,
      actorId: userId,
      metadata: { projectId: updatedProject.id, ...dto },
    });

    return updatedProject;
  }

  // ─── Delete ──────────────────────────────────────────────────

  async remove(
    orgId: string,
    projectId: string,
    userId: string,
  ): Promise<void> {
    // Only Owner or Admin can delete
    await this.orgsService.verifyRole(orgId, userId, [
      OrgRole.OWNER,
      OrgRole.ADMIN,
    ]);

    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId: orgId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.projectRepository.softRemove(project);

    await this.activityService.log({
      action: ActivityAction.PROJECT_DELETED,
      entityType: 'Organization',
      entityId: orgId,
      organizationId: orgId,
      actorId: userId,
      metadata: { projectId: project.id, name: project.name },
    });
  }

  // ─── Helper used by TasksService (Day 4) ─────────────────────

  async verifyProjectBelongsToOrg(
    projectId: string,
    orgId: string,
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId: orgId },
    });

    if (!project) {
      throw new NotFoundException(
        'Project not found in this organization',
      );
    }

    return project;
  }
}