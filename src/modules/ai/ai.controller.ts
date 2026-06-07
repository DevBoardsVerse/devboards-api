import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { SuggestTaskDto } from './suggest-task.dto';
import { SuggestTaskResult } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggest-task')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate task description and suggest priority using AI' })
  suggestTask(@Body() dto: SuggestTaskDto): Promise<SuggestTaskResult> {
    return this.aiService.suggestTask(dto);
  }
}