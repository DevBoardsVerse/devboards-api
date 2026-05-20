import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OrganizationMember,
  OrgRole,
} from './entities/organization-member.entity';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { OrganizationsService } from './organizations.service';
import { UsersService } from '../users/user.service';

import { ActivityService } from '../activity/activity.service';
import { ActivityAction } from '../activity/entities/activity-log.entity';
import { Organization } from './entities/organization.entity';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    private orgsService: OrganizationsService,
    private usersService: UsersService,
    private activityService: ActivityService,  // added this for logging
  ) {}

  // ─── List members ─────────────────────────────────────────────

  async listMembers(orgId: string, requesterId: string) {
    // Any member can see the list — just verify membership
    await this.orgsService.verifyMembership(orgId, requesterId);

    return this.memberRepository.find({
      where: { organizationId: orgId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  // ─── Invite ───────────────────────────────────────────────────

  async invite(
    orgId: string,
    requesterId: string,
    dto: InviteMemberDto,
  ): Promise<OrganizationMember> {
    // 1. Only Owner or Admin can invite
    const requesterMembership = await this.orgsService.verifyRole(
      orgId,
      requesterId,
      [OrgRole.OWNER, OrgRole.ADMIN],
    );

    // 2. Admin cannot invite someone as Admin
    // Only Owner can add other Admins
    // This prevents privilege escalation
    if (
      requesterMembership.role === OrgRole.ADMIN &&
      dto.role === OrgRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Admins cannot invite other admins — only the Owner can',
      );
    }

    // 3. Find the user being invited by email
    const targetUser = await this.usersService.findByEmail(dto.email);
    if (!targetUser) {
      throw new NotFoundException(
        `No user found with email ${dto.email} — they must register first`,
      );
    }

    // 4. Check they are not already a member
    const existingMembership = await this.orgsService.getMembership(
      orgId,
      targetUser.id,
    );
    if (existingMembership) {
      throw new ConflictException(
        `${dto.email} is already a member of this organization`,
      );
    }

    // 5. Create the membership
    const membership = this.memberRepository.create({
      organizationId: orgId,
      userId: targetUser.id,
      role: dto.role ?? OrgRole.MEMBER,
    });

    const savedMembership = await this.memberRepository.save(membership);

    await this.activityService.log({
      action: ActivityAction.MEMBER_INVITED,
      entityType: 'Organization',
      entityId: savedMembership.id,
      organizationId: orgId,
      actorId: requesterId,
      metadata: { userId: targetUser.id, role: savedMembership.role },
    });

    return savedMembership;
  }

  // ─── Update role ──────────────────────────────────────────────

  async updateRole(
    orgId: string,
    requesterId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<OrganizationMember> {
    // 1. Get requester's membership — must be Owner or Admin
    const requesterMembership = await this.orgsService.verifyRole(
      orgId,
      requesterId,
      [OrgRole.OWNER, OrgRole.ADMIN],
    );

    // 2. Cannot change your own role
    if (requesterId === targetUserId) {
      throw new BadRequestException('You cannot change your own role');
    }

    // 3. Get target's current membership
    const targetMembership = await this.orgsService.getMembership(
      orgId,
      targetUserId,
    );
    if (!targetMembership) {
      throw new NotFoundException('This user is not a member of the organization');
    }

    // 4. Nobody can change the Owner's role
    if (targetMembership.role === OrgRole.OWNER) {
      throw new ForbiddenException(
        'The owner role cannot be changed — transfer ownership instead',
      );
    }

    // 5. Admin cannot promote to Admin or demote another Admin
    // Only Owner can manage Admin-level members
    if (requesterMembership.role === OrgRole.ADMIN) {
      if (
        dto.role === OrgRole.ADMIN ||
        targetMembership.role === OrgRole.ADMIN
      ) {
        throw new ForbiddenException(
          'Admins cannot manage other admins — only the Owner can',
        );
      }
    }

    // 6. All checks passed — update the role
    const oldRole = targetMembership.role;
    targetMembership.role = dto.role;
    const updatedMembership = await this.memberRepository.save(targetMembership);

    await this.activityService.log({
      action: ActivityAction.MEMBER_ROLE_CHANGED,
      entityType: 'Organization',
      entityId: updatedMembership.id,
      organizationId: orgId,
      actorId: requesterId,
      metadata: { userId: targetUserId, from: oldRole, to: dto.role },
    });

    return updatedMembership;
  }

  // ─── Remove member ────────────────────────────────────────────

  async removeMember(
    orgId: string,
    requesterId: string,
    targetUserId: string,
  ): Promise<void> {
    // 1. Get requester's membership — must be Owner or Admin
    const requesterMembership = await this.orgsService.verifyRole(
      orgId,
      requesterId,
      [OrgRole.OWNER, OrgRole.ADMIN],
    );

    // 2. Cannot remove yourself — use "leave org" for that
    if (requesterId === targetUserId) {
      throw new BadRequestException(
        'You cannot remove yourself — delete the organization instead if you are the owner',
      );
    }

    // 3. Get target's membership
    const targetMembership = await this.orgsService.getMembership(
      orgId,
      targetUserId,
    );
    if (!targetMembership) {
      throw new NotFoundException('This user is not a member of the organization');
    }

    // 4. Owner cannot be removed
    if (targetMembership.role === OrgRole.OWNER) {
      throw new ForbiddenException(
        'The owner cannot be removed from the organization',
      );
    }

    // 5. Admin cannot remove another Admin
    if (
      requesterMembership.role === OrgRole.ADMIN &&
      targetMembership.role === OrgRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Admins cannot remove other admins — only the Owner can',
      );
    }

    // 6. All checks passed — delete the membership
    await this.memberRepository.remove(targetMembership);

    await this.activityService.log({
      action: ActivityAction.MEMBER_REMOVED,
      entityType: 'Organization',
      entityId: targetMembership.id,
      organizationId: orgId,
      actorId: requesterId,
      metadata: { userId: targetUserId, role: targetMembership.role },
    });
  }
}