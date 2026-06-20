import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import {
  SimulationEndReason,
  SimulationSessionStatus,
} from '../../../common/enums';
import { Scenario } from './scenario.entity';
import { ScenarioCharacter } from './scenario-character.entity';

@Entity('simulation_sessions')
@Index(['userId', 'status', 'updatedAt'])
@Index(['scenarioId', 'status'])
@Index('UQ_simulation_sessions_one_incomplete_per_user', ['userId'], {
  unique: true,
  where: "deleted_at IS NULL AND status IN ('ACTIVE', 'PAUSED')",
})
@Check(
  'CHK_simulation_sessions_total_tokens_non_negative',
  '"total_tokens" >= 0',
)
@Check(
  'CHK_simulation_sessions_total_score_range',
  '"total_score" IS NULL OR ("total_score" >= 0 AND "total_score" <= 100)',
)
@Check(
  'CHK_simulation_sessions_total_messages_non_negative',
  '"total_messages" >= 0',
)
export class SimulationSession extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ name: 'scenario_id' })
  scenarioId: string;

  @ManyToOne('Scenario', 'sessions', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scenario_id' })
  scenario: Scenario;

  @Column({ name: 'chosen_character_id' })
  chosenCharacterId: string;

  @ManyToOne('ScenarioCharacter', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'chosen_character_id' })
  chosenCharacter: ScenarioCharacter;

  @Column({
    type: 'enum',
    enum: SimulationSessionStatus,
    default: SimulationSessionStatus.ACTIVE,
  })
  status: SimulationSessionStatus;

  @Column({ name: 'total_tokens', default: 0 })
  totalTokens: number;

  @Column({ name: 'next_turn_character_id', type: 'uuid' })
  nextTurnCharacterId: string;

  @ManyToOne('ScenarioCharacter', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'next_turn_character_id' })
  nextTurnCharacter: ScenarioCharacter;

  @OneToMany('SimulationMessage', 'session')
  messages: any[];

  @Column({ name: 'total_score', type: 'int', nullable: true })
  totalScore?: number;

  @Column({
    name: 'criteria_scores',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  criteriaScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;

  @Column({
    name: 'end_reason',
    type: 'enum',
    enum: SimulationEndReason,
    nullable: true,
  })
  endReason?: SimulationEndReason;

  @Column({ name: 'ai_summary', type: 'text', nullable: true })
  aiSummary?: string;

  @Column({ name: 'total_messages', type: 'int', default: 0 })
  totalMessages: number;

  @Column({ name: 'result_created_at', type: 'timestamp', nullable: true })
  resultCreatedAt?: Date;
}

export const SimulationResult = SimulationSession;
export type SimulationResult = SimulationSession;
