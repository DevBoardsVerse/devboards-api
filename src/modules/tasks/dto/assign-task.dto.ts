// import { ApiProperty } from '@nestjs/swagger';
// import { IsUUID, IsOptional } from 'class-validator';

// export class AssignTaskDto {
//   @ApiProperty({
//     description: 'UUID of user to assign. Send null to unassign.',
//     nullable: true,
//     example: 'abc-123-uuid',
//   })
//   @IsUUID()
//   @IsOptional()
//   declare assigneeId: string | null;
// }
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class AssignTaskDto {
  @ApiProperty({
    description: 'UUID of user to assign. Send null to unassign.',
    nullable: true,
    example: null,
  })
  @IsOptional()
  @IsUUID('all', { message: 'assigneeId must be a valid UUID or null' })
  @Transform(({ value }) => value === null || value === 'null' ? null : value)
  declare assigneeId: string | null;
}