import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { UserLevel, Difficulty } from '../../../common/enums';
import { ScenarioCategory } from './scenario-category.entity';

@Entity('scenarios')
@Index(['categoryId', 'requiredLevel', 'isPublished'])
export class Scenario extends BaseEntity {
  @Column({ name: 'category_id' })
  categoryId: string;

  @ManyToOne('ScenarioCategory', 'scenarios', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: ScenarioCategory;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'system_prompt', type: 'text' })
  systemPrompt: string;

  @Column({ name: 'opening_message', type: 'text', nullable: true })
  openingMessage: string | null;

  @Column({
    name: 'required_level',
    type: 'enum',
    enum: UserLevel,
  })
  requiredLevel: UserLevel;

  @Column({
    type: 'enum',
    enum: Difficulty,
  })
  difficulty: Difficulty;

  @Column({
    name: 'scoring_criteria',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  scoringCriteria: Array<{ name: string; description: string; weight: number }>;

  @Column({ name: 'max_turns', type: 'int', nullable: true })
  maxTurns: number | null;

  @Column({ name: 'estimated_minutes', type: 'int' })
  estimatedMinutes: number;

  @Column({ name: 'is_published', default: true })
  isPublished: boolean;

  @OneToMany('ScenarioCharacter', 'scenario')
  characters: any[];

  @OneToMany('SimulationSession', 'scenario')
  sessions: any[];

  @OneToMany('SimulationSession', 'scenario')
  results: any[];
}
