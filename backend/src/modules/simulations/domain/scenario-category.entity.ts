import { Entity, Column, OneToMany, Index, Check } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';

@Entity('scenario_categories')
@Index('UQ_scenario_categories_active_order_index', ['orderIndex'], {
  unique: true,
  where: 'deleted_at IS NULL',
})
@Check('CHK_scenario_categories_order_index_non_negative', '"order_index" >= 0')
export class ScenarioCategory extends BaseEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar' })
  icon: string;

  @Column({ type: 'varchar' })
  color: string;

  @Column({ name: 'order_index', type: 'int' })
  orderIndex: number;

  @OneToMany('Scenario', 'category')
  scenarios: any[];
}
