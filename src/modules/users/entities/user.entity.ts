import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

// Roles a user can have across the app
export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('users')   // maps to a table called 'users' in Postgres
export class User {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;   // UUID instead of integer — harder to guess, better for APIs

  @Column({ unique: true })
  declare email: string;

  @Column()
  declare password: string;   // bcrypt hash, never plain text

  @Column()
  declare firstName: string;

  @Column()
  declare lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  declare role: UserRole;

  @Column({ default: true })
  declare isActive: boolean;

  // These three are managed automatically by TypeORM
  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;

  // Soft delete — sets this timestamp instead of actually deleting the row
  // This is the pattern from your internship you already know
  @DeleteDateColumn()
  declare deletedAt: Date;
}