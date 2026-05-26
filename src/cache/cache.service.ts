import { Injectable } from '@nestjs/common';
import { RedisService } from '../modules/redis/redis.service';

@Injectable()
export class CacheService {
  constructor(private redisService: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisService.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.redisService.set(key, serialized, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await this.redisService.delete(key);
  }

  keys = {
    orgActivity: (orgId: string) => `activity:org:${orgId}`,
    orgMembers: (orgId: string) => `members:org:${orgId}`,
    projectList: (orgId: string) => `projects:org:${orgId}`,
    taskList: (orgId: string, projectId: string) =>
      `tasks:project:${projectId}:org:${orgId}`,
  };
}