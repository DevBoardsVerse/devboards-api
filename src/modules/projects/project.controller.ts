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
} from '@nestjs/swagger';
import { ProjectsService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('projects')
@ApiBearerAuth('access-token')
@Controller('organizations/:orgId/projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a project — Owner or Admin only' })
  @ApiCreatedResponse({ description: 'Project created' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  async create(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(orgId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all projects in an organization' })
  @ApiOkResponse({ description: 'Project list returned' })
  @ApiForbiddenResponse({ description: 'Not a member of this org' })
  async findAll(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
  ) {
    return this.projectsService.findAll(orgId, user.id);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get one project by ID' })
  @ApiOkResponse({ description: 'Project details' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  async findOne(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.projectsService.findOne(orgId, projectId, user.id);
  }

  @Patch(':projectId')
  @ApiOperation({ summary: 'Update a project — Owner or Admin only' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  async update(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(orgId, projectId, user.id, dto);
  }

  @Delete(':projectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project — Owner or Admin only' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  async remove(
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.projectsService.remove(orgId, projectId, user.id);
  }
}