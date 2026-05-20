import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  COMPLETED = 'completed',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column()
  declare name: string;

  @Column({ nullable: true })
  declare description: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  declare status: ProjectStatus;

  @Column({ nullable: true })
  declare dueDate: Date;

  // ─── Relationships ───────────────────────────────────────────

  // Many projects belong to one organization
  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  declare organization: Organization;

  @Column()
  declare organizationId: string;

  // Who created this project
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdById' })
  declare createdBy: User;

  @Column()
  declare createdById: string;

  // ─── Timestamps ──────────────────────────────────────────────
  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;

  @DeleteDateColumn()
  declare deletedAt: Date;
}