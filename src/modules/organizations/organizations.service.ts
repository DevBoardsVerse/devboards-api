import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationMember, OrgRole } from './entities/organization-member.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,

    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
  ) {}

  // ─── Create ──────────────────────────────────────────────────

  async create(userId: string, dto: CreateOrganizationDto): Promise<Organization> {
    // Create the organization
    const org = this.orgRepository.create({
      ...dto,
      ownerId: userId,
    });

    const savedOrg = await this.orgRepository.save(org);

    // Automatically add the creator as OWNER in the members table
    // This way membership checks are consistent —
    // you always query organization_members, never special-case the owner
    const ownerMembership = this.memberRepository.create({
      userId,
      organizationId: savedOrg.id,
      role: OrgRole.OWNER,
    });

    await this.memberRepository.save(ownerMembership);

    return savedOrg;
  }

  // ─── Read ─────────────────────────────────────────────────────

  // Get all orgs the current user is a member of
  async findAllForUser(userId: string): Promise<Organization[]> {
    // We join through organization_members to find orgs this user belongs to
    return this.orgRepository
      .createQueryBuilder('org')
      .innerJoin(
        'org.members',
        'member',
        'member.userId = :userId',
        { userId },
      )
      .leftJoinAndSelect('org.owner', 'owner')  // include owner details
      .where('org.deletedAt IS NULL')
      .orderBy('org.createdAt', 'DESC')
      .getMany();
  }

  async findOne(orgId: string, userId: string): Promise<Organization> {
    // First verify the user is actually a member of this org
    await this.verifyMembership(orgId, userId);

    const org = await this.orgRepository.findOne({
      where: { id: orgId },
      relations: ['owner', 'members', 'members.user'],
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async findOrgById(orgId: string): Promise<Organization> {
    const org = await this.orgRepository.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  // ─── Update ──────────────────────────────────────────────────

  async update(
    orgId: string,
    userId: string,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    // Only Owner or Admin can update org details
    await this.verifyRole(orgId, userId, [OrgRole.OWNER, OrgRole.ADMIN]);

    const org = await this.orgRepository.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    Object.assign(org, dto);
    return this.orgRepository.save(org);
  }

  // ─── Delete ──────────────────────────────────────────────────

  async remove(orgId: string, userId: string): Promise<void> {
    // Only the Owner can delete the entire organization
    await this.verifyRole(orgId, userId, [OrgRole.OWNER]);

    // softRemove sets deletedAt instead of actually deleting
    const org = await this.orgRepository.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    await this.orgRepository.softRemove(org);
  }

  // ─── Permission helpers ───────────────────────────────────────
  // These are the most important methods — used everywhere

  // Verify user is a member at all — throws 403 if not
  async verifyMembership(
    orgId: string,
    userId: string,
  ): Promise<OrganizationMember> {
    const membership = await this.memberRepository.findOne({
      where: { organizationId: orgId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return membership;
  }

  // Verify user has one of the required roles — throws 403 if not
  async verifyRole(
    orgId: string,
    userId: string,
    allowedRoles: OrgRole[],
  ): Promise<OrganizationMember> {
    const membership = await this.verifyMembership(orgId, userId);

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `This action requires role: ${allowedRoles.join(' or ')}`,
      );
    }

    return membership;
  }

  // Get just the membership record — useful in other services
  async getMembership(
    orgId: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    return this.memberRepository.findOne({
      where: { organizationId: orgId, userId },
    });
  }
}