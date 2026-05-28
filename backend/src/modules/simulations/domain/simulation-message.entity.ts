import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { SimulationSession } from './simulation-session.entity';

@Entity('simulation_messages')
export class SimulationMessage extends BaseEntity {
  @Column({ name: 'session_id' })
  sessionId: string;

  @ManyToOne('SimulationSession', 'messages', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: SimulationSession;

  @Column({ name: 'speaker_character_id', nullable: true })
  speakerCharacterId: string | null;

  @ManyToOne('ScenarioCharacter', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'speaker_character_id' })
  speakerCharacter: any;

  @Column({ name: 'is_learner' })
  isLearner: boolean;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'content_en', type: 'text', nullable: true })
  contentEn: string | null;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  feedback: {
    corrections: Array<{
      original: string;
      corrected: string;
      type: 'spelling' | 'grammar';
      severity: 'error' | 'warning';
      startIndex: number;
      endIndex: number;
    }>;
    review: string | null;
    reviewAvailable: boolean;
  } | null;

  @Column({ name: 'order_index', type: 'int' })
  orderIndex: number;
}
