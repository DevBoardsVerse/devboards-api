import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Organization } from './organization.entity';

// Roles specific to an organization
// Completely separate from the global UserRole on User entity
export enum OrgRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

// @Unique ensures one user can only have ONE membership per org
// Without this, the same user could be added multiple times
@Unique(['userId', 'organizationId'])
@Entity('organization_members')
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({
    type: 'enum',
    enum: OrgRole,
    default: OrgRole.MEMBER,
  })
  declare role: OrgRole;

  // ─── Relationships ───────────────────────────────────────────

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  declare user: User;

  @Column()
  declare userId: string;

  @ManyToOne(() => Organization, (org) => org.members, {
    nullable: false,
    onDelete: 'CASCADE', // if org is deleted, memberships are deleted too
  })
  @JoinColumn({ name: 'organizationId' })
  declare organization: Organization;

  @Column()
  declare organizationId: string;

  @CreateDateColumn()
  declare joinedAt: Date;
}