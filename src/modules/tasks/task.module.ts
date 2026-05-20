import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ProjectsModule } from '../projects/project.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    OrganizationsModule,  // for permission checks
    ProjectsModule,       // for verifyProjectBelongsToOrg
    ActivityModule,
  ],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}