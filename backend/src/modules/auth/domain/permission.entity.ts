import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { Permission as PermissionEnum } from '../../../common/enums';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({
    type: 'enum',
    enum: PermissionEnum,
    unique: true,
  })
  name: PermissionEnum;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'general' })
  category: string;
}
