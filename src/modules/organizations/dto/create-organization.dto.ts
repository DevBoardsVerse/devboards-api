import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Mazhong Technologies' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  declare name: string;

  @ApiPropertyOptional({ example: 'We build software for multiple corporations' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}