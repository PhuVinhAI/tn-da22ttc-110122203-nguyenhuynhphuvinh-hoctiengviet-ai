import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir =
    process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

  constructor() {
    void this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  /**
   * Upload a file
   * @param file File buffer
   * @param originalName Original filename
   * @param mimetype File mimetype
   * @returns Uploaded file info
   */
  async uploadFile(
    file: Buffer,
    originalName: string,
    mimetype: string,
  ): Promise<UploadedFile> {
    const ext = path.extname(originalName);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.writeFile(filePath, file);

    const uploadedFile: UploadedFile = {
      filename,
      originalName,
      path: filePath,
      url: `/uploads/${filename}`,
      size: file.length,
      mimetype,
    };

    this.logger.log(`File uploaded: ${filename}`);
    return uploadedFile;
  }

  /**
   * Upload audio file
   * @param file Audio file buffer
   * @param originalName Original filename
   * @returns Uploaded file info
   */
  async uploadAudio(file: Buffer, originalName: string): Promise<UploadedFile> {
    const audioDir = path.join(this.uploadDir, 'audio');
    await fs.mkdir(audioDir, { recursive: true });

    const ext = path.extname(originalName);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(audioDir, filename);

    await fs.writeFile(filePath, file);

    return {
      filename,
      originalName,
      path: filePath,
      url: `/uploads/audio/${filename}`,
      size: file.length,
      mimetype: 'audio/mpeg',
    };
  }

  /**
   * Upload image file
   * @param file Image file buffer
   * @param originalName Original filename
   * @param mimetype Mimetype from request
   * @returns Uploaded file info
   */
  async uploadImage(
    file: Buffer,
    originalName: string,
    mimetype = 'image/jpeg',
  ): Promise<UploadedFile> {
    const imageDir = path.join(this.uploadDir, 'images');
    await fs.mkdir(imageDir, { recursive: true });

    const ext = path.extname(originalName);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(imageDir, filename);

    await fs.writeFile(filePath, file);

    return {
      filename,
      originalName,
      path: filePath,
      url: `/uploads/images/${filename}`,
      size: file.length,
      mimetype,
    };
  }

  /**
   * Upload video file
   * @param file Video file buffer
   * @param originalName Original filename
   * @param mimetype Mimetype from request
   * @returns Uploaded file info
   */
  async uploadVideo(
    file: Buffer,
    originalName: string,
    mimetype = 'video/mp4',
  ): Promise<UploadedFile> {
    const videoDir = path.join(this.uploadDir, 'videos');
    await fs.mkdir(videoDir, { recursive: true });

    const ext = path.extname(originalName);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(videoDir, filename);

    await fs.writeFile(filePath, file);

    return {
      filename,
      originalName,
      path: filePath,
      url: `/uploads/videos/${filename}`,
      size: file.length,
      mimetype,
    };
  }

  /**
   * Delete a file by sub-path (e.g. "audio/xxx.mp3" or "images/yyy.jpg" or "zzz.png" for legacy root files).
   */
  async deleteFile(subPath: string): Promise<void> {
    const filePath = path.join(this.uploadDir, subPath);

    try {
      await fs.unlink(filePath);
      this.logger.log(`File deleted: ${subPath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${subPath}`, error);
      throw error;
    }
  }

  /**
   * Resolve a relative or absolute URL back to a sub-path under uploadDir.
   * Accepts both legacy absolute URLs (http://host/uploads/...) and current relative URLs (/uploads/...).
   * Returns null if URL doesn't contain /uploads/.
   */
  resolveUrlToSubPath(url: string): string | null {
    const marker = '/uploads/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length);
  }

  /**
   * Delete a file given its public URL. No-op if URL isn't ours.
   */
  async deleteByUrl(url: string): Promise<boolean> {
    const subPath = this.resolveUrlToSubPath(url);
    if (!subPath) {
      this.logger.warn(`URL not managed by storage service: ${url}`);
      return false;
    }
    try {
      await this.deleteFile(subPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file info
   * @param filename Filename
   * @returns File stats
   */
  async getFileInfo(filename: string): Promise<any> {
    const filePath = path.join(this.uploadDir, filename);

    try {
      const stats = await fs.stat(filePath);
      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (_error) {
      this.logger.error(`File not found: ${filename}`);
      return null;
    }
  }

  /**
   * Check if file exists
   * @param filename Filename
   */
  async fileExists(filename: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, filename);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get relative file URL
   * @param filename Filename
   */
  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}
