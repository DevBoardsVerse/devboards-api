import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { OrgRole } from '../entities/organization-member.entity';

export class InviteMemberDto {
  @ApiProperty({ example: 'newmember@example.com' })
  @IsEmail()
  declare email: string;

  @ApiProperty({
    enum: [OrgRole.ADMIN, OrgRole.MEMBER, OrgRole.VIEWER],
    example: OrgRole.MEMBER,
    description: 'Role to assign. Cannot invite someone as Owner.',
  })
  @IsEnum([OrgRole.ADMIN, OrgRole.MEMBER, OrgRole.VIEWER], {
    message: 'Role must be admin, member, or viewer. Cannot invite as owner.',
  })
  @IsOptional()
  role?: OrgRole = OrgRole.MEMBER;
}