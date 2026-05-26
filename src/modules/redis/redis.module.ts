import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const isProduction = config.get<string>('NODE_ENV') === 'production';
        
        const client = new Redis({
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
          tls: isProduction ? { rejectUnauthorized: false } : undefined,
          retryStrategy: (times) => {
            if (times > 3) return null;
            return Math.min(times * 200, 1000);
          },
          maxRetriesPerRequest: 1,
        });

        // Prevent unhandled error crashes — just log cleanly
        client.on('error', (err) => {
          console.error('[Redis] Connection error:', err.message);
        });

        client.on('connect', () => {
          console.log('[Redis] Connected successfully');
        });

        return client;
      },
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}