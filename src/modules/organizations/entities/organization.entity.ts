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
import { User } from '../../users/entities/user.entity';
import { OrganizationMember } from './organization-member.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column()
  declare name: string;

  @Column({ nullable: true })
  declare description: string;

  @Column({ nullable: true })
  declare avatarUrl: string;

  // ─── Relationships ───────────────────────────────────────────

  // Every org has one owner — a User
  // ManyToOne: many organizations can have the same owner
  // JoinColumn creates the foreign key column: ownerId
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'ownerId' })
  declare owner: User;

  @Column()
  declare ownerId: string;

  // One org has many members (through the join table)
  // cascade: true means if you save an org with members array,
  // TypeORM saves the members too automatically
  @OneToMany(() => OrganizationMember, (member) => member.organization, {
    cascade: true,
  })
  declare members: OrganizationMember[];

  // ─── Timestamps ──────────────────────────────────────────────
  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;

  @DeleteDateColumn()
  declare deletedAt: Date;
}