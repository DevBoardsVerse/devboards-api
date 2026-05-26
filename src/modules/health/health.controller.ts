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
import { Public } from '../../common/decorators/roles.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()   // add at class level — skips all throttling for this controller
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
    description: 'Returns status of app and database connection. Redis checked separately.',
  })
  @ApiOkResponse({
    description: 'critical services are healthy',
    schema: {
      example: {
        status: 'ok',
        info: { 
          database: { status: 'up' },
        },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'database is unreachable',
  })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      // Redis checked separately — don't block health on it
    ]);
  }
}