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
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

// No @UseGuards needed — JwtAuthGuard is global
// No @Public() — these routes require authentication
@ApiTags('organizations')
@ApiBearerAuth('access-token')
@Controller('organizations')
export class OrganizationsController {
  constructor(private orgsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiCreatedResponse({ description: 'Organization created successfully' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.orgsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations I am a member of' })
  @ApiOkResponse({ description: 'List of organizations' })
  async findAll(@CurrentUser() user: User) {
    return this.orgsService.findAllForUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one organization by ID' })
  @ApiOkResponse({ description: 'Organization details with members' })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  @ApiForbiddenResponse({ description: 'Not a member of this organization' })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    // ParseUUIDPipe validates that :id is a valid UUID format
    // Returns 400 automatically if someone passes "abc" instead of a UUID
  ) {
    return this.orgsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization — Owner or Admin only' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.orgsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)  // 204 — success but no response body
  @ApiOperation({ summary: 'Delete organization — Owner only' })
  @ApiForbiddenResponse({ description: 'Only the owner can delete' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.orgsService.remove(id, user.id);
  }
}