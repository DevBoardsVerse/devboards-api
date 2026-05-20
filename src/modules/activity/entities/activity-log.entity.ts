import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum ActivityAction {
  // Task actions
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_ASSIGNED = 'task_assigned',
  TASK_DELETED = 'task_deleted',
  TASK_STATUS_CHANGED = 'task_status_changed',

  // Project actions
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_DELETED = 'project_deleted',

  // Member actions
  MEMBER_INVITED = 'member_invited',
  MEMBER_REMOVED = 'member_removed',
  MEMBER_ROLE_CHANGED = 'member_role_changed',
}

@Entity('activity_logs')
@Index(['organizationId', 'createdAt'])  // fast lookup: recent activity in org
@Index(['entityId', 'entityType'])       // fast lookup: activity for specific resource
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({
    type: 'enum',
    enum: ActivityAction,
  })
  declare action: ActivityAction;

  // What type of thing changed
  @Column()
  declare entityType: string;

  // The ID of the thing that changed
  @Column()
  declare entityId: string;

  // Flexible extra data — jsonb lets you store any JSON structure
  // and Postgres can even query inside it
  @Column({ type: 'jsonb', nullable: true })
  declare metadata: Record<string, any>;

  // ─── Relationships ───────────────────────────────────────────

  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  declare organization: Organization;

  @Column()
  declare organizationId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'actorId' })
  declare actor: User;

  @Column()
  declare actorId: string;

  // No updatedAt or deletedAt — logs are immutable
  // You never edit or delete an audit trail
  @CreateDateColumn()
  declare createdAt: Date;
}