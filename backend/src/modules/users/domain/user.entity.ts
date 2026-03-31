import { Entity, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../database/base/base.entity';
import { UserLevel } from '../../../common/enums';
import { UserProgress } from '../../progress/domain/user-progress.entity';
import { UserVocabulary } from '../../vocabularies/domain/user-vocabulary.entity';
import { UserExerciseResult } from '../../exercises/domain/user-exercise-result.entity';
import { Role } from '../../auth/domain/role.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

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

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt: Date;

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @OneToMany(() => UserProgress, (progress) => progress.user)
  progress: UserProgress[];

  @OneToMany(() => UserVocabulary, (vocabulary) => vocabulary.user)
  vocabularies: UserVocabulary[];

  @OneToMany(() => UserExerciseResult, (result) => result.user)
  exerciseResults: UserExerciseResult[];
}
