import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { Scenario } from './scenario.entity';

@Entity('scenario_characters')
@Index(['scenarioId', 'orderIndex'])
export class ScenarioCharacter extends BaseEntity {
  @Column({ name: 'scenario_id' })
  scenarioId: string;

  @ManyToOne('Scenario', 'characters', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scenario_id' })
  scenario: Scenario;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  role: string;

  @Column({ type: 'text' })
  personality: string;

  @Column({ name: 'speech_style', type: 'text' })
  speechStyle: string;

  @Column({ name: 'avatar_key', type: 'varchar', nullable: true })
  avatarKey: string | null;

  @Column({ name: 'is_playable', default: true })
  isPlayable: boolean;

  @Column({ name: 'order_index', type: 'int' })
  orderIndex: number;
}
