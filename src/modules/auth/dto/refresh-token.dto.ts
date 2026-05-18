import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ description: 'The refresh token to invalidate' })
  @IsString()
  @IsNotEmpty()
  declare refreshToken: string;
}