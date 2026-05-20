import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrgRole } from '../entities/organization-member.entity';

export class UpdateMemberRoleDto {
  @ApiProperty({
    enum: [OrgRole.ADMIN, OrgRole.MEMBER, OrgRole.VIEWER],
    example: OrgRole.MEMBER,
  })
  @IsEnum([OrgRole.ADMIN, OrgRole.MEMBER, OrgRole.VIEWER], {
    message: 'Role must be admin, member, or viewer. Cannot assign owner role.',
  })
  declare role: OrgRole;
}