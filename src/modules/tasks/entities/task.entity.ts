import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('tasks')
// @Index on columns you will filter or sort by frequently
// Without indexes, Postgres scans every row — slow on large tables
// With indexes, Postgres jumps directly to matching rows — fast
@Index(['projectId', 'status'])       // common filter: tasks in project by status
@Index(['organizationId', 'assigneeId']) // common filter: tasks assigned to user in org
export class Task {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column()
  declare title: string;

  @Column({ nullable: true, type: 'text' })
  declare description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  declare status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  declare priority: TaskPriority;

  @Column({ nullable: true })
  declare dueDate: Date;

  // ─── Relationships ───────────────────────────────────────────

  @ManyToOne(() => Project, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  declare project: Project;

  @Column()
  declare projectId: string;

  // Denormalized for fast permission checks — explained above
  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  declare organization: Organization;

  @Column()
  declare organizationId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdById' })
  declare createdBy: User;

  @Column()
  declare createdById: string;

  // Assignee is nullable — task can exist without being assigned
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  declare assignee: User;

  @Column({ nullable: true })
  declare assigneeId: string | null;

  // ─── Timestamps ──────────────────────────────────────────────
  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;

  @DeleteDateColumn()
  declare deletedAt: Date;
}