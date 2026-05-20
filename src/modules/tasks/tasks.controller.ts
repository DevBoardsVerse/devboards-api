import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { TaskStatus, TaskPriority } from './entities/task.entity';

@ApiTags('tasks')
@ApiBearerAuth('access-token')
@Controller('organizations/:orgId/projects/:projectId/tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task — Member, Admin, Owner' })
  @ApiCreatedResponse({ description: 'Task created' })
  @ApiForbiddenResponse({ description: 'Viewers cannot create tasks' })
  async create(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(orgId, projectId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tasks with optional filters and pagination' })
  @ApiOkResponse({ description: 'Paginated task list' })
  // @ApiQuery documents each query param in Swagger
  @ApiQuery({ name: 'status', enum: TaskStatus, required: false })
  @ApiQuery({ name: 'priority', enum: TaskPriority, required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async findAll(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() filters: TaskFilterDto,
    // @Query() maps all query string params to the DTO
    // ValidationPipe validates and transforms them
  ) {
    return this.tasksService.findAll(orgId, projectId, user.id, filters);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get one task by ID' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  async findOne(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.tasksService.findOne(orgId, projectId, taskId, user.id);
  }

  @Patch(':taskId')
  @ApiOperation({ summary: 'Update a task — creator, assignee, Admin, or Owner' })
  @ApiForbiddenResponse({ description: 'Insufficient permission' })
  async update(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(orgId, projectId, taskId, user.id, dto);
  }

  @Patch(':taskId/assign')
  @ApiOperation({ summary: 'Assign or unassign a task — Admin or Owner or creater only' })
  @ApiForbiddenResponse({ description: 'Only Admin or Owner can assign tasks' })
  async assign(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: AssignTaskDto,
  ) {
    return this.tasksService.assign(orgId, projectId, taskId, user.id, dto);
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task — creator or Admin/Owner' })
  @ApiForbiddenResponse({ description: 'Insufficient permission' })
  async remove(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.tasksService.remove(orgId, projectId, taskId, user.id);
  }
}