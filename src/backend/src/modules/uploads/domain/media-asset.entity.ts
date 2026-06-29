import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';

export type MediaKind = 'image' | 'audio' | 'video';

@Entity('media_assets')
export class MediaAsset extends BaseEntity {
  @Column({ type: 'enum', enum: ['image', 'audio', 'video'] })
  kind: MediaKind;

  @Column()
  filename: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Index('IDX_media_assets_url')
  @Column({ unique: true })
  url: string;

  @Column()
  mimetype: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ name: 'uploaded_by', nullable: true })
  uploadedBy?: string;
}
