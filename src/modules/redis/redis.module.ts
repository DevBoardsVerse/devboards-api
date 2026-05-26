import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

// @Global() means you only need to import this module once in AppModule
// and it's available everywhere without re-importing
@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        return new Redis({
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
          tls: {},  // always set tls object for Upstash
          retryStrategy: (times) => {
            if (times > 3) return null;
            return Math.min(times * 200, 1000);
          },
        });
      },
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}