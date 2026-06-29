import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';

@Entity('scenario_categories')
export class ScenarioCategory extends BaseEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar' })
  icon: string;

  @Column({ type: 'varchar' })
  color: string;

  @OneToMany('Scenario', 'category')
  scenarios: any[];
}
