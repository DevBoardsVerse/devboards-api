import { ApiProperty } from '@nestjs/swagger';

export class AttachmentResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare originalName: string;

  @ApiProperty()
  declare url: string;

  @ApiProperty()
  declare mimeType: string;

  @ApiProperty()
  declare size: number;

  @ApiProperty()
  declare uploadedById: string;

  @ApiProperty()
  declare taskId: string;

  @ApiProperty()
  declare createdAt: Date;
}