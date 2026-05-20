import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectsService } from './project.service';
import { ProjectsController } from './project.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    OrganizationsModule,
    ActivityModule,
    // OrganizationsModule is imported so ProjectsService
    // can inject OrganizationsService for permission checks
    // This works because OrganizationsModule exports OrganizationsService
  ],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
  // exported so TasksModule can use verifyProjectBelongsToOrg() on Day 4
})
export class ProjectsModule {}