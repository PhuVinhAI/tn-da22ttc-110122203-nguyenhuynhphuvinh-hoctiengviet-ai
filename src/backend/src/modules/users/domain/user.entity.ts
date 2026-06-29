import { Entity, Column, OneToMany, Index, Check } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../database/base/base.entity';
import { UserLevel, Dialect, Role } from '../../../common/enums';
import { getRoleView } from '../../../common/auth/role-permissions';
// Type-only imports keep the string-target @OneToMany decorators (which avoid
// circular runtime imports) while giving the relation fields real types.
// Erased at runtime — the decorator metadata, not these types, drives loading.
import type { LearningProgress } from '../../progress/domain/learning-progress.entity';
import type { UserQuestionResult } from '../../exercises/domain/user-question-result.entity';
import type { QuestionAttempt } from '../../exercises/domain/question-attempt.entity';
import type { RefreshToken } from '../../auth/domain/refresh-token.entity';
import type { PersonalVocabulary } from '../../personal-vocabularies/domain/personal-vocabulary.entity';

@Entity('users')
@Index('UQ_users_active_email', ['email'], {
  unique: true,
  where: 'deleted_at IS NULL',
})
@Index('UQ_users_active_google_id', ['googleId'], {
  unique: true,
  where: 'deleted_at IS NULL AND google_id IS NOT NULL',
})
@Check(
  'CHK_users_notification_time_format',
  `"notification_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'`,
)
export class User extends BaseEntity {
  @Column()
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  @Column({ name: 'google_id', nullable: true })
  googleId?: string;

  @Column({ default: 'local' })
  provider: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'native_language', default: 'English' })
  nativeLanguage: string;

  @Column({
    type: 'enum',
    enum: UserLevel,
    name: 'current_level',
    default: UserLevel.A1,
  })
  currentLevel: UserLevel;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({
    type: 'enum',
    enum: Dialect,
    name: 'preferred_dialect',
    default: Dialect.STANDARD,
  })
  preferredDialect: Dialect;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt: Date;

  @Column({ name: 'onboarding_completed', default: false })
  onboardingCompleted: boolean;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  get roles(): ReturnType<typeof getRoleView>[] {
    return [getRoleView(this.role)];
  }

  @OneToMany('LearningProgress', 'user')
  progress: LearningProgress[];

  @OneToMany('UserQuestionResult', 'user')
  questionResults: UserQuestionResult[];

  @OneToMany('QuestionAttempt', 'user')
  questionAttempts: QuestionAttempt[];

  @OneToMany('RefreshToken', 'user')
  refreshTokens: RefreshToken[];

  @OneToMany('PersonalVocabulary', 'user')
  personalVocabularies: PersonalVocabulary[];

  @Column({ name: 'notification_enabled', default: false })
  notificationEnabled: boolean;

  @Column({ name: 'notification_time', default: '20:00' })
  notificationTime: string;

  toJSON() {
    const plain = { ...this } as Record<string, unknown>;
    delete plain.password;
    plain.roles = this.roles;
    return plain;
  }
}
