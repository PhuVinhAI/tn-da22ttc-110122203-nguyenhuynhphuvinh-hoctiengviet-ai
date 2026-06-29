import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { MediaAsset, type MediaKind } from '../domain/media-asset.entity';

const MAX_SIZE: Record<MediaKind, number> = {
  image: 5 * 1024 * 1024,
  audio: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
};

const PREFIX: Record<MediaKind, string> = {
  image: 'image/',
  audio: 'audio/',
  video: 'video/',
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly storage: StorageService,
    @InjectRepository(MediaAsset)
    private readonly mediaRepo: Repository<MediaAsset>,
  ) {}

  validate(kind: MediaKind, file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Thiếu file trong request');
    }
    if (!file.mimetype.startsWith(PREFIX[kind])) {
      throw new BadRequestException(
        `Sai định dạng. Cần ${kind}, nhận được ${file.mimetype}`,
      );
    }
    if (file.size > MAX_SIZE[kind]) {
      const mb = (MAX_SIZE[kind] / 1024 / 1024).toFixed(0);
      throw new BadRequestException(`File quá lớn. Giới hạn ${mb}MB`);
    }
  }

  async upload(
    kind: MediaKind,
    file: Express.Multer.File,
    uploadedBy?: string,
  ): Promise<MediaAsset> {
    this.validate(kind, file);

    const uploaded =
      kind === 'image'
        ? await this.storage.uploadImage(
            file.buffer,
            file.originalname,
            file.mimetype,
          )
        : kind === 'audio'
          ? await this.storage.uploadAudio(file.buffer, file.originalname)
          : await this.storage.uploadVideo(
              file.buffer,
              file.originalname,
              file.mimetype,
            );

    const asset = this.mediaRepo.create({
      kind,
      filename: uploaded.filename,
      originalName: uploaded.originalName,
      url: uploaded.url,
      mimetype: file.mimetype,
      size: file.size,
      uploadedBy,
    });
    return this.mediaRepo.save(asset);
  }

  async deleteById(id: string): Promise<void> {
    const asset = await this.mediaRepo.findOne({ where: { id } });
    if (!asset) throw new NotFoundException('Không tìm thấy tệp');
    await this.removeAsset(asset);
  }

  async deleteByUrl(url: string): Promise<void> {
    const asset = await this.mediaRepo.findOne({ where: { url } });
    if (!asset) {
      // Fall through: still attempt disk-level delete, log
      const removed = await this.storage.deleteByUrl(url);
      if (!removed) {
        this.logger.warn(
          `deleteByUrl: asset not found in DB and disk delete failed: ${url}`,
        );
      }
      return;
    }
    await this.removeAsset(asset);
  }

  private async removeAsset(asset: MediaAsset): Promise<void> {
    await this.storage.deleteByUrl(asset.url);
    await this.mediaRepo.remove(asset);
  }
}
