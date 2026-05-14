import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API root — returns basic info' })
  root() {
    return {
      name: 'DevBoard API',
      version: '1.0',
      docs: '/api/docs',
      health: '/health',
    };
  }
}