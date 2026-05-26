import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AppCacheModule } from '../../cache/cache.module';
import { GatewayModule } from '../gateway/gateway.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityLog]),
    forwardRef(() => OrganizationsModule),
    AppCacheModule,
    forwardRef(() => GatewayModule),
  ],
  providers: [ActivityService],
  controllers: [ActivityController],
  exports: [ActivityService],
  // exported so TasksService, MembersService etc can inject it
})
export class ActivityModule {}