import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';

@Entity('refresh_tokens')
@Index(['userId', 'revokedAt'])
export class RefreshToken extends BaseEntity {
  @Column({ type: 'varchar', length: 500, unique: true })
  token: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent?: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @ManyToOne('User', 'refreshTokens', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  // Helper method
  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  isRevoked(): boolean {
    return !!this.revokedAt;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }
}
