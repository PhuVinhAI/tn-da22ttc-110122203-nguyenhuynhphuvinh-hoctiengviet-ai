import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { PersonalVocabularySource } from '../../../common/enums';

@Entity('personal_vocabularies')
@Index(['userId'], {})
export class PersonalVocabulary extends BaseEntity {
  @Column()
  word: string;

  @Column()
  translation: string;

  @Column({ name: 'part_of_speech', nullable: true })
  partOfSpeech?: string;

  @Column({ name: 'example_sentence', type: 'text', nullable: true })
  exampleSentence?: string;

  @Column({ name: 'example_translation', type: 'text', nullable: true })
  exampleTranslation?: string;

  @Column({ nullable: true })
  classifier?: string;

  @Column({ name: 'dialect_variants', type: 'jsonb', nullable: true })
  dialectVariants?: Record<string, string>;

  @Column({
    type: 'enum',
    enum: PersonalVocabularySource,
    name: 'source',
  })
  source: PersonalVocabularySource;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne('User', 'personalVocabularies', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;
}
