import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuggestTaskDto {
  @ApiProperty({ example: 'Fix login bug on mobile' })
  @IsString()
  @IsNotEmpty()
  declare title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}