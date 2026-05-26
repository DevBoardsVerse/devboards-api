import { Module, Global } from '@nestjs/common';
import { RedisModule } from '../modules/redis/redis.module';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [RedisModule],  // RedisModule already @Global but import explicitly here
  providers: [CacheService],
  exports: [CacheService],
})
export class AppCacheModule {}
