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
import { Task } from '../../tasks/entities/task.entity';

@Entity('attachments')
@Index(['taskId'])  // fast lookup: all attachments for a task
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  // Original filename — shown in UI
  @Column()
  declare originalName: string;

  // R2 object key — used for deletion
  // format: tasks/attachments/uuid.ext
  @Column()
  declare storageKey: string;

  // Public URL — used for download
  @Column()
  declare url: string;

  // MIME type — used by browser to handle download correctly
  @Column()
  declare mimeType: string;

  // File size in bytes — shown in UI
  @Column({ type: 'int' })
  declare size: number;

  // ─── Relationships ───────────────────────────────────────────

  @ManyToOne(() => Task, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  declare task: Task;

  @Column()
  declare taskId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'uploadedById' })
  declare uploadedBy: User;

  @Column()
  declare uploadedById: string;

  @CreateDateColumn()
  declare createdAt: Date;
}