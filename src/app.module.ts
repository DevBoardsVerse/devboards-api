import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './modules/redis/redis.module';
import { RolesGuard } from './common/guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProjectsModule } from './modules/projects/project.module';
import { TasksModule } from './modules/tasks/task.module';
import { ActivityModule } from './modules/activity/activity.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [databaseConfig, redisConfig, jwtConfig], // registers typed configs
    }),
    DatabaseModule,
    HealthModule,
    UsersModule,
    AuthModule,
    RedisModule,
    OrganizationsModule,
    ProjectsModule,
    TasksModule,
    ActivityModule,
  ],

  providers: [
    // APP_GUARD applies guards to every route in the app
    // Guards run in the order they are listed
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,   // runs first — are you logged in?
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,     // runs second — do you have the right role?
    },
  ],
})
export class AppModule {}