import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization-member.entity';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';

import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { UsersModule } from '../users/user.module';

import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, OrganizationMember]),
    UsersModule,
    forwardRef(() => ActivityModule),
  ],
  providers: [OrganizationsService, MembersService],
  controllers: [OrganizationsController, MembersController],
  exports: [OrganizationsService, MembersService],
  // export so ProjectsModule can use verifyMembership() later
})
export class OrganizationsModule {}