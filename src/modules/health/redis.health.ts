import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// A health indicator is just a class that pings a service
// and returns { serviceName: { status: 'up' | 'down' } }
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private client: Redis;

  constructor(private config: ConfigService) {
    super();
    // Create a Redis client just for health checks
    this.client = new Redis({
      host: this.config.get<string>('redis.host'),
      port: this.config.get<number>('redis.port'),
      // Don't retry forever if Redis is down during health check
      maxRetriesPerRequest: 1,
      lazyConnect: true,   // don't connect until we actually ping
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.client.ping();
      // getStatus is inherited from HealthIndicator
      // it builds the { key: { status: 'up' } } shape
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, { error: error.message }),
      );
    }
  }
}