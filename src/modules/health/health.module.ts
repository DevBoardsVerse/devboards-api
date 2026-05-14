import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { RedisHealthIndicator } from './redis.health';

@Module({
  imports: [
    TerminusModule,
    HttpModule,   // terminus needs this internally
  ],
  controllers: [HealthController, AppController],
  providers:[RedisHealthIndicator],
})
export class HealthModule {}