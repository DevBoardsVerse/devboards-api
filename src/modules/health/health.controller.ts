import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { RedisHealthIndicator } from './redis.health';
import { Public } from 'src/common/decorators/roles.decorator';

@Public()
@ApiTags('health')   // groups this under the 'health' section in Swagger UI
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,  // inject our custom indicator

  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Check app health',
    description: 'Returns status of app and database connection and redis',
  })
  @ApiOkResponse({
    description: 'all services are healthy',
    schema: {
      example: {
        status: 'ok',
        info: { 
          database: { status: 'up' },
          redis: { status: 'up' },
        },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'one or more service is unreachable',
  })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}