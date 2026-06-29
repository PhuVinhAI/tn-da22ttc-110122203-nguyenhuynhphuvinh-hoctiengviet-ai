import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { User } from '../../users/domain/user.entity';

export enum AuthTokenPurpose {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

@Entity('auth_tokens')
@Index(['purpose', 'userId', 'usedAt'])
@Index(['purpose', 'code', 'userId', 'usedAt'])
export class AuthToken extends BaseEntity {
  @Column({ type: 'varchar', length: 500, unique: true })
  token: string;

  @Column({ length: 6, nullable: true })
  code?: string;

  @Column({
    type: 'enum',
    enum: AuthTokenPurpose,
  })
  purpose: AuthTokenPurpose;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt?: Date;
}
