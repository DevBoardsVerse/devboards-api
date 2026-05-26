import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/roles.decorator';
import { SkipThrottle } from '@nestjs/throttler';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @SkipThrottle()   // add at class level — skips all throttling for this controller
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
