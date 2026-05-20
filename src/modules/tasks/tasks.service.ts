import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { OrganizationsService } from '../organizations/organizations.service';
import { ProjectsService } from '../projects/project.service';
import { OrgRole } from '../organizations/entities/organization-member.entity';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction } from '../activity/entities/activity-log.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private orgsService: OrganizationsService,
    private projectsService: ProjectsService,
    private activityService: ActivityService,  // added this for logging activity
  ) {}

  // ─── Create ──────────────────────────────────────────────────

  async create(
    orgId: string,
    projectId: string,
    userId: string,
    dto: CreateTaskDto,
  ): Promise<Task> {
    // Any member can create tasks (Member, Admin, Owner)
    // Viewer cannot
    await this.orgsService.verifyRole(orgId, userId, [
      OrgRole.OWNER,
      OrgRole.ADMIN,
      OrgRole.MEMBER,
    ]);

    // Verify the project actually belongs to this org
    // Prevents creating tasks in a project from a different org
    await this.projectsService.verifyProjectBelongsToOrg(projectId, orgId);

    // If assigneeId provided, verify they are actually a member of the org
    if (dto.assigneeId) {
      await this.verifyAssigneeMembership(orgId, dto.assigneeId);
    }

    const task = this.taskRepository.create({
      ...dto,
      projectId,
      organizationId: orgId,  // denormalized
      createdById: userId,
    });

    const savedTask = await this.taskRepository.save(task);  // save first

    await this.activityService.log({
      action: ActivityAction.TASK_CREATED,
      entityType: 'task',
      entityId: savedTask.id,
      organizationId: orgId,
      actorId: userId,
      metadata: { title: savedTask.title, priority: savedTask.priority },
    });

    return savedTask;  // return after log
  }

  // ─── Read with filters + pagination ──────────────────────────

  async findAll(
    orgId: string,
    projectId: string,
    userId: string,
    filters: TaskFilterDto,
  ): Promise<{ tasks: Task[]; total: number; page: number; totalPages: number }> {
    // Any member can read tasks
    await this.orgsService.verifyMembership(orgId, userId);
    await this.projectsService.verifyProjectBelongsToOrg(projectId, orgId);

    const { page = 1, limit = 20, status, priority, assigneeId, createdById } = filters;

    // QueryBuilder gives us fine-grained control over the SQL
    // More flexible than .find() for dynamic filters
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('task.organizationId = :orgId', { orgId });

    // Apply optional filters only if provided
    // This builds the WHERE clause dynamically
    if (status) {
      query.andWhere('task.status = :status', { status });
    }
    if (priority) {
      query.andWhere('task.priority = :priority', { priority });
    }
    if (assigneeId) {
      query.andWhere('task.assigneeId = :assigneeId', { assigneeId });
    }
    if (createdById) {
      query.andWhere('task.createdById = :createdById', { createdById });
    }

    // Pagination
    // skip = how many records to skip (page - 1) * limit
    // take = how many records to return
    // e.g. page 2, limit 20: skip 20, take 20
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    // Order by priority then creation date
    query.addSelect(
      `CASE task.priority
        WHEN 'urgent' THEN 1
        WHEN 'high'   THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low'    THEN 4
      END`,
      'priority_order',
    )
    .orderBy('priority_order', 'ASC')
    .addOrderBy('task.createdAt', 'DESC');

    // getManyAndCount returns [results, totalCount] in one query
    const [tasks, total] = await query.getManyAndCount();

    return {
      tasks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    orgId: string,
    projectId: string,
    taskId: string,
    userId: string,
  ): Promise<Task> {
    await this.orgsService.verifyMembership(orgId, userId);

    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId, organizationId: orgId },
      relations: ['createdBy', 'assignee', 'project'],
    });

    if (!task) throw new NotFoundException('Task not found');

    return task;
  }

  // ─── Update ──────────────────────────────────────────────────

  async update(
    orgId: string,
    projectId: string,
    taskId: string,
    userId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.findOne(orgId, projectId, taskId, userId);

    // Get requester's membership
    const membership = await this.orgsService.verifyMembership(orgId, userId);

    // Can update if:
    // - they created the task
    // - they are assigned to the task
    // - they are Owner or Admin
    const isCreator = task.createdById === userId;
    const isAssignee = task.assigneeId === userId;
    const isAdminOrOwner = [OrgRole.OWNER, OrgRole.ADMIN].includes(
      membership.role,
    );

    if (!isCreator && !isAssignee && !isAdminOrOwner) {
      throw new ForbiddenException(
        'Only the task creator, assignee, or an admin can update this task',
      );
    }

    // If changing assigneeId, verify new assignee is an org member
    if (dto.assigneeId) {
      await this.verifyAssigneeMembership(orgId, dto.assigneeId);
    }
    const oldStatus = task.status;  // capture BEFORE mutation

    Object.assign(task, dto);
    const updatedTask = await this.taskRepository.save(task);

    if (dto.status && dto.status !== oldStatus) {
      await this.activityService.log({
        action: ActivityAction.TASK_STATUS_CHANGED,
        entityType: 'task',
        entityId: task.id,
        organizationId: orgId,
        actorId: userId,
        metadata: { from: oldStatus, to: dto.status },
      });
    } else {
      await this.activityService.log({
        action: ActivityAction.TASK_UPDATED,
        entityType: 'task',
        entityId: task.id,
        organizationId: orgId,
        actorId: userId,
        metadata: dto,
      });
    }

    return updatedTask;  // return after log
  }

  // ─── Assign ──────────────────────────────────────────────────

  async assign(
  orgId: string,
  projectId: string,
  taskId: string,
  requesterId: string,
  dto: AssignTaskDto,
): Promise<Task> {
  await this.orgsService.verifyRole(orgId, requesterId, [
    OrgRole.OWNER,
    OrgRole.ADMIN,
  ]);

  const task = await this.findOne(orgId, projectId, taskId, requesterId);

  if (dto.assigneeId !== null && dto.assigneeId !== undefined) {
    await this.verifyAssigneeMembership(orgId, dto.assigneeId);
  }

  // Use update() instead of save() for null values
  // update() runs a direct SQL UPDATE — it doesn't skip nulls
  await this.taskRepository.update(task.id, {
    assigneeId: dto.assigneeId ?? null,
  });

  await this.activityService.log({
    action: ActivityAction.TASK_ASSIGNED,
    entityType: 'task',
    entityId: task.id,
    organizationId: orgId,
    actorId: requesterId,
    metadata: { assigneeId: dto.assigneeId },
  });

  // Fetch and return the updated task
  return this.findOne(orgId, projectId, taskId, requesterId);
}

  // ─── Delete ──────────────────────────────────────────────────

  async remove(
    orgId: string,
    projectId: string,
    taskId: string,
    userId: string,
  ): Promise<void> {
    const task = await this.findOne(orgId, projectId, taskId, userId);

    const membership = await this.orgsService.verifyMembership(orgId, userId);

    const isCreator = task.createdById === userId;
    const isAdminOrOwner = [OrgRole.OWNER, OrgRole.ADMIN].includes(
      membership.role,
    );

    if (!isCreator && !isAdminOrOwner) {
      throw new ForbiddenException(
        'Only the task creator or an admin can delete this task',
      );
    }

    await this.taskRepository.softRemove(task);

    await this.activityService.log({
      action: ActivityAction.TASK_DELETED,
      entityType: 'task',
      entityId: task.id,
      organizationId: orgId,
      actorId: userId,
      metadata: { title: task.title },
    });
  }

  // ─── Private helpers ─────────────────────────────────────────

  private async verifyAssigneeMembership(
    orgId: string,
    assigneeId: string,
  ): Promise<void> {
    // You can only assign a task to someone who is
    // actually a member of the organization
    const membership = await this.orgsService.getMembership(orgId, assigneeId);
    if (!membership) {
      throw new BadRequestException(
        'Cannot assign task to a user who is not a member of this organization',
      );
    }
  }
}