import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { PartOfSpeech, Dialect } from '../../../common/enums';
import { Lesson } from '../../courses/domain/lesson.entity';
import { UserVocabulary } from './user-vocabulary.entity';

@Entity('vocabularies')
export class Vocabulary extends BaseEntity {
  @Column()
  word: string;

  @Column()
  translation: string;

  @Column({ nullable: true })
  phonetic?: string;

  @Column({
    type: 'enum',
    enum: PartOfSpeech,
    name: 'part_of_speech',
  })
  partOfSpeech: PartOfSpeech;

  @Column({ name: 'example_sentence', type: 'text', nullable: true })
  exampleSentence?: string;

  @Column({ name: 'example_translation', type: 'text', nullable: true })
  exampleTranslation?: string;

  @Column({ name: 'audio_url', nullable: true })
  audioUrl?: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  // Classifier for nouns (e.g., "con" for animals, "cái" for objects)
  @Column({ nullable: true })
  classifier?: string;

  // Regional dialect variants (e.g., {"SOUTHERN": "heo", "NORTHERN": "lợn"})
  @Column({ name: 'dialect_variants', type: 'jsonb', nullable: true })
  dialectVariants?: Record<Dialect, string>;

  // Audio URLs for different dialects
  @Column({ name: 'audio_urls', type: 'jsonb', nullable: true })
  audioUrls?: Record<Dialect, string>;

  // Primary dialect/region for this vocabulary (if region-specific)
  @Column({
    type: 'enum',
    enum: Dialect,
    nullable: true,
  })
  region?: Dialect;

  @Column({ name: 'difficulty_level', default: 1 })
  difficultyLevel: number;

  @Column({ name: 'lesson_id' })
  lessonId: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.vocabularies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @OneToMany(() => UserVocabulary, (userVocab) => userVocab.vocabulary)
  userVocabularies: UserVocabulary[];
}
