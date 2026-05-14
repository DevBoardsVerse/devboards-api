import { ApiProperty } from '@nestjs/swagger';

// This is the standard shape every endpoint returns
// { success: true, data: {...} }  or  { success: false, message: '...' }
export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  declare success: boolean;

  @ApiProperty({ example: 'Operation successful' })
  declare message: string;

  @ApiProperty()
  data?: T;
}